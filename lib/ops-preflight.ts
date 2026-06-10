import type { AppEnv } from "./env.ts"

export type PreflightOptions = {
  ci: boolean
}

export function resolvePreflightOptions(args: string[]): PreflightOptions {
  return {
    ci: args.includes("--ci"),
  }
}

export function collectPreflightWarnings(env: Partial<AppEnv>, options: PreflightOptions) {
  const warnings: string[] = []

  if (!env.NEXT_PUBLIC_SITE_URL && !options.ci) {
    warnings.push("NEXT_PUBLIC_SITE_URL tanimli degil.")
  }

  if ((!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) && !options.ci) {
    warnings.push("Admin kimlik bilgileri tam degil.")
  }

  if (!options.ci) {
    warnings.push(...collectPlaceholderWarnings(env))
  }

  return warnings
}

export function filterPreflightEnvIssues(issues: string[], options: PreflightOptions) {
  if (!options.ci) {
    return issues
  }

  return issues.filter((issue) => issue !== "DATABASE_URL tanimlanmalidir.")
}

function collectPlaceholderWarnings(env: Partial<AppEnv>) {
  const warnings: string[] = []
  const databaseUrl = env.DATABASE_URL?.trim().toLowerCase() ?? ""
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim().toLowerCase() ?? ""
  const adminPassword = env.ADMIN_PASSWORD?.trim().toLowerCase() ?? ""
  const allowedOriginHosts = env.ALLOWED_ORIGIN_HOSTS?.trim().toLowerCase() ?? ""

  if (
    databaseUrl.includes("user:password@host") ||
    databaseUrl.includes("/db_name") ||
    databaseUrl === "postgresql://demo"
  ) {
    warnings.push("DATABASE_URL ornek veya placeholder gorunuyor.")
  }

  if (siteUrl.includes("example.com")) {
    warnings.push("NEXT_PUBLIC_SITE_URL ornek bir alan adina isaret ediyor.")
  }

  if (
    adminPassword === "change-this-password-now" ||
    adminPassword === "changeme123456" ||
    adminPassword === "password123456"
  ) {
    warnings.push("ADMIN_PASSWORD varsayilan veya zayif bir deger gibi gorunuyor.")
  }

  if (allowedOriginHosts.includes("example.com")) {
    warnings.push("ALLOWED_ORIGIN_HOSTS ornek host degerleri iceriyor.")
  }

  return warnings
}
