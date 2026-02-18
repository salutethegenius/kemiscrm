import crypto from 'crypto'

// Symmetric encryption helper for storing provider credentials.
// Uses EMAIL_ENCRYPTION_KEY (32-byte base64) from environment.

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM recommended IV size

function getKey(): Buffer {
  const keyB64 = process.env.EMAIL_ENCRYPTION_KEY
  if (!keyB64) {
    throw new Error('EMAIL_ENCRYPTION_KEY is not configured')
  }
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be 32 bytes base64-encoded')
  }
  return key
}

export function encryptSecret(plain: string): string {
  if (!plain) return ''
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSecret(cipherText: string | null): string {
  if (!cipherText) return ''
  const key = getKey()
  const buf = Buffer.from(cipherText, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + 16)
  const encrypted = buf.subarray(IV_LENGTH + 16)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

