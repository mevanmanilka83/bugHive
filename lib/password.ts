import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)

const SALT_BYTES = 32
const KEY_LEN = 64

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const hash = (await scryptAsync(plainPassword, salt, KEY_LEN)) as Buffer
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export async function verifyPassword(
  plainPassword: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(":")
  if (parts.length !== 2) return false
  const [saltHex, hashHex] = parts
  const salt = Buffer.from(saltHex, "hex")
  const expectedHash = Buffer.from(hashHex, "hex")
  if (salt.length !== SALT_BYTES || expectedHash.length !== KEY_LEN) return false
  const hash = (await scryptAsync(plainPassword, salt, KEY_LEN)) as Buffer
  return timingSafeEqual(hash, expectedHash)
}
