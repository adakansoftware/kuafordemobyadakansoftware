import { createHash, createHmac } from "node:crypto"
import { AuditActorType, type AuditEvent } from "@prisma/client"
import { createAuditLog } from "./audit-log.ts"
import { getEnv, getOptionalEnv } from "./env.ts"
import { logEvent } from "./observability.ts"
import { claimRateLimitWindow, peekRateLimitState, setRateLimitState } from "./rate-limit.ts"
import { withCircuitBreaker, withTimeout } from "./resilience.ts"
import { getRequestIpFromHeaders } from "./security-core.ts"

const FORM_MIN_AGE_MS = 1_500
const FORM_MAX_AGE_MS = 2 * 60 * 60 * 1000

function getSecuritySecret() {
  const env = getOptionalEnv()

  if (env.APP_SECURITY_SECRET?.trim()) {
    return env.APP_SECURITY_SECRET.trim()
  }

  try {
    return createHash("sha256").update(getEnv().DATABASE_URL).digest("hex")
  } catch {
    return "development-fallback-security-secret"
  }
}

export type PublicFormChallenge = {
  formIssuedAt: string
  formSignature: string
}

export function createPublicFormChallenge(scope: string, issuedAt = Date.now()): PublicFormChallenge {
  const formIssuedAt = String(issuedAt)
  const formSignature = createHmac("sha256", getSecuritySecret()).update(`${scope}:${formIssuedAt}`).digest("hex")

  return {
    formIssuedAt,
    formSignature,
  }
}

export function verifyPublicFormChallenge(
  scope: string,
  challenge: {
    formIssuedAt?: string | null
    formSignature?: string | null
  }
) {
  const issuedAt = Number(challenge.formIssuedAt ?? 0)

  if (!Number.isFinite(issuedAt) || issuedAt <= 0 || !challenge.formSignature) {
    return {
      ok: false,
      reason: "missing_form_challenge",
      ageMs: null,
    }
  }

  const expected = createHmac("sha256", getSecuritySecret()).update(`${scope}:${issuedAt}`).digest("hex")
  const ageMs = Date.now() - issuedAt

  if (challenge.formSignature !== expected) {
    return {
      ok: false,
      reason: "invalid_form_signature",
      ageMs,
    }
  }

  if (ageMs < FORM_MIN_AGE_MS) {
    return {
      ok: false,
      reason: "form_submitted_too_fast",
      ageMs,
    }
  }

  if (ageMs > FORM_MAX_AGE_MS) {
    return {
      ok: false,
      reason: "form_expired",
      ageMs,
    }
  }

  return {
    ok: true,
    reason: null,
    ageMs,
  }
}

export function buildRequestFingerprint(
  headers: Headers,
  extras: Record<string, string | number | boolean | null | undefined> = {}
) {
  const values = [
    headers.get("user-agent")?.trim().slice(0, 160) ?? "",
    headers.get("accept-language")?.trim().slice(0, 80) ?? "",
    headers.get("sec-fetch-site")?.trim().slice(0, 40) ?? "",
    headers.get("sec-ch-ua-platform")?.trim().slice(0, 40) ?? "",
    ...Object.entries(extras)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${String(value ?? "")}`),
  ].join("|")

  return createHash("sha256").update(values).digest("hex").slice(0, 32)
}

export function buildReplayKey(scope: string, headers: Headers, payload: string) {
  return createHash("sha256")
    .update([scope, getRequestIpFromHeaders(headers), buildRequestFingerprint(headers), payload].join("|"))
    .digest("hex")
}

export async function claimReplayWindow(scope: string, replayKey: string, windowMs: number) {
  return claimRateLimitWindow({
    namespace: `replay:${scope}`,
    key: replayKey,
    windowMs,
  })
}

export async function getTemporaryBlock(scope: string, clientKey: string) {
  return peekRateLimitState({
    namespace: `blocked:${scope}`,
    key: clientKey,
  })
}

export async function blockTemporarily(scope: string, clientKey: string, windowMs: number) {
  await setRateLimitState({
    namespace: `blocked:${scope}`,
    key: clientKey,
    count: 1,
    windowMs,
  })
}

export async function recordSuspicion(input: {
  scope: string
  clientKey: string
  score: number
  requestId?: string
  route?: string
  reason: string
  meta?: Record<string, unknown>
  audit?: boolean
}) {
  const namespace = `suspicion:${input.scope}`
  const existing = await peekRateLimitState({
    namespace,
    key: input.clientKey,
  })
  const accumulatedScore = (existing?.count ?? 0) + input.score

  await setRateLimitState({
    namespace,
    key: input.clientKey,
    count: accumulatedScore,
    windowMs: 30 * 60_000,
  })

  logEvent({
    level: "warn",
    event: "security_suspicion_recorded",
    requestId: input.requestId,
    route: input.route,
    message: input.reason,
    meta: {
      clientKey: input.clientKey,
      scope: input.scope,
      score: input.score,
      accumulatedScore,
      ...input.meta,
    },
  })

  if (input.audit) {
    await createAuditLog({
      actorType: AuditActorType.ANONYMOUS,
      actorIdentifier: input.clientKey,
      event: "SECURITY_ALERT" as AuditEvent,
      targetType: "security_request",
      requestId: input.requestId ?? null,
      metadata: {
        scope: input.scope,
        reason: input.reason,
        score: input.score,
        accumulatedScore,
        ...input.meta,
      },
    })
  }

  return accumulatedScore
}

export async function verifyTurnstileToken(input: {
  token?: string | null
  ipAddress?: string | null
  requestId?: string
}) {
  const env = getOptionalEnv()

  if (!env.TURNSTILE_SECRET_KEY) {
    return {
      ok: true,
      enforced: false,
      reason: "turnstile_not_configured",
    }
  }

  if (!input.token?.trim()) {
    return {
      ok: false,
      enforced: true,
      reason: "turnstile_token_missing",
    }
  }

  const token = input.token.trim()

  try {
    const response = await withCircuitBreaker(
      "turnstile-verify",
      () =>
        withTimeout(
          fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              secret: env.TURNSTILE_SECRET_KEY ?? "",
              response: token,
              ...(input.ipAddress ? { remoteip: input.ipAddress } : {}),
            }),
            cache: "no-store",
          }),
          4_000,
          "Turnstile verification timed out."
        ),
      {
        failureThreshold: 3,
        coolDownMs: 60_000,
      }
    )
    const payload = (await response.json()) as { success?: boolean }

    return {
      ok: Boolean(payload.success),
      enforced: true,
      reason: payload.success ? null : "turnstile_verification_failed",
    }
  } catch (error) {
    logEvent({
      level: "warn",
      event: "turnstile_verification_error",
      requestId: input.requestId,
      route: "turnstile",
      message: error instanceof Error ? error.message : "Turnstile verification failed.",
    })

    return {
      ok: false,
      enforced: true,
      reason: "turnstile_verification_error",
    }
  }
}
