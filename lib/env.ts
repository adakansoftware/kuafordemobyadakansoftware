import { z } from "zod"

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}, z.string().optional())

const optionalUrlString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}, z.string().url().optional())

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL tanimlanmalidir."),
  NEXT_PUBLIC_SITE_URL: optionalUrlString,
  ADMIN_USERNAME: optionalTrimmedString,
  ADMIN_PASSWORD: optionalTrimmedString,
  ALLOWED_ORIGIN_HOSTS: optionalTrimmedString,
  APP_SECURITY_SECRET: optionalTrimmedString,
  TURNSTILE_SECRET_KEY: optionalTrimmedString,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalTrimmedString,
  ADMIN_ALLOWLIST_IPS: optionalTrimmedString,
  SETUP_ACCESS_TOKEN: optionalTrimmedString,
  HEALTHCHECK_TOKEN: optionalTrimmedString,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

export type AppEnv = z.infer<typeof envSchema>

let cachedEnv: AppEnv | null = null

function parseEnv() {
  return envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
    APP_SECURITY_SECRET: process.env.APP_SECURITY_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    ADMIN_ALLOWLIST_IPS: process.env.ADMIN_ALLOWLIST_IPS,
    SETUP_ACCESS_TOKEN: process.env.SETUP_ACCESS_TOKEN,
    HEALTHCHECK_TOKEN: process.env.HEALTHCHECK_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  })
}

function collectEnvIssues(env: AppEnv) {
  const issues: string[] = []
  const hasAdminUsername = Boolean(env.ADMIN_USERNAME)
  const hasAdminPassword = Boolean(env.ADMIN_PASSWORD)
  const normalizedDatabaseUrl = env.DATABASE_URL.trim().toLowerCase()

  if (hasAdminUsername !== hasAdminPassword) {
    issues.push("ADMIN_USERNAME ve ADMIN_PASSWORD birlikte tanimlanmalidir.")
  }

  if (env.ADMIN_USERNAME && env.ADMIN_USERNAME.length < 3) {
    issues.push("ADMIN_USERNAME en az 3 karakter olmalidir.")
  }

  if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < 12) {
    issues.push("ADMIN_PASSWORD en az 12 karakter olmalidir.")
  }

  if (env.APP_SECURITY_SECRET && env.APP_SECURITY_SECRET.length < 24) {
    issues.push("APP_SECURITY_SECRET en az 24 karakter olmalidir.")
  }

  if (env.NODE_ENV === "production" && !env.NEXT_PUBLIC_SITE_URL) {
    issues.push("Production ortaminda NEXT_PUBLIC_SITE_URL zorunludur.")
  }

  if (env.HEALTHCHECK_TOKEN && env.HEALTHCHECK_TOKEN.length < 24) {
    issues.push("HEALTHCHECK_TOKEN en az 24 karakter olmalidir.")
  }

  if (!normalizedDatabaseUrl.startsWith("postgres://") && !normalizedDatabaseUrl.startsWith("postgresql://")) {
    issues.push("DATABASE_URL PostgreSQL baglantisi olmalidir.")
  }

  if (
    env.ALLOWED_ORIGIN_HOSTS &&
    env.ALLOWED_ORIGIN_HOSTS
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .some((value) => value.includes("://") || value.includes("/"))
  ) {
    issues.push("ALLOWED_ORIGIN_HOSTS sadece host isimleri icermelidir.")
  }

  const hasTurnstileSiteKey = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const hasTurnstileSecret = Boolean(env.TURNSTILE_SECRET_KEY)

  if (hasTurnstileSiteKey !== hasTurnstileSecret) {
    issues.push("Turnstile ayarlari icin NEXT_PUBLIC_TURNSTILE_SITE_KEY ve TURNSTILE_SECRET_KEY birlikte tanimlanmalidir.")
  }

  if (
    env.ADMIN_ALLOWLIST_IPS &&
    env.ADMIN_ALLOWLIST_IPS
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .some((value) => value.includes("/") || value.includes(" "))
  ) {
    issues.push("ADMIN_ALLOWLIST_IPS sadece virgulle ayrilmis tekil IP degerleri icermelidir.")
  }

  return issues
}

export function resetEnvCacheForTests() {
  cachedEnv = null
}

export function getEnvIssues() {
  const parsed = parseEnv()

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => issue.message)
  }

  return collectEnvIssues(parsed.data)
}

export function getOptionalEnv() {
  return envSchema.partial().parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
    APP_SECURITY_SECRET: process.env.APP_SECURITY_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    ADMIN_ALLOWLIST_IPS: process.env.ADMIN_ALLOWLIST_IPS,
    SETUP_ACCESS_TOKEN: process.env.SETUP_ACCESS_TOKEN,
    HEALTHCHECK_TOKEN: process.env.HEALTHCHECK_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  })
}

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsed = parseEnv()

  if (!parsed.success) {
    throw new Error(`Ortam degiskenleri dogrulanamadi: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`)
  }

  const issues = collectEnvIssues(parsed.data)

  if (issues.length > 0) {
    throw new Error(`Ortam degiskenleri dogrulanamadi: ${issues.join(", ")}`)
  }

  cachedEnv = parsed.data
  return cachedEnv
}

export const env = getOptionalEnv()
