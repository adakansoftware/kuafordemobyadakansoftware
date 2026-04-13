import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL tanımlı olmalıdır."),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  ALLOWED_ORIGIN_HOSTS: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
  NODE_ENV: process.env.NODE_ENV,
})

if (!parsedEnv.success) {
  throw new Error(`Ortam değişkenleri doğrulanamadı: ${parsedEnv.error.issues.map((issue) => issue.message).join(", ")}`)
}

export const env = parsedEnv.data
