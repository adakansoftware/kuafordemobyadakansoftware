import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":")

  if (!salt || !storedHash) {
    return false
  }

  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  const stored = Buffer.from(storedHash, "hex")

  if (candidate.length !== stored.length) {
    return false
  }

  return timingSafeEqual(candidate, stored)
}
