import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>

const SCRYPT_KEY_LENGTH = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)).toString("hex")
  return `${salt}:${derived}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":")

  if (!salt || !storedHash) {
    return false
  }

  const candidate = await scrypt(password, salt, SCRYPT_KEY_LENGTH)
  const stored = Buffer.from(storedHash, "hex")

  if (candidate.length !== stored.length) {
    return false
  }

  return timingSafeEqual(candidate, stored)
}
