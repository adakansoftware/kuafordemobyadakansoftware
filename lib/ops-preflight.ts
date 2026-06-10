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

  return warnings
}

export function filterPreflightEnvIssues(issues: string[], options: PreflightOptions) {
  if (!options.ci) {
    return issues
  }

  return issues.filter((issue) => issue !== "DATABASE_URL tanimlanmalidir.")
}
