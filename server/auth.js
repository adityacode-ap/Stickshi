import crypto from 'node:crypto'

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return { salt, hash }
}

export function verifyPassword(password, salt, storedHash) {
  const { hash } = hashPassword(password, salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function createToken() {
  return crypto.randomBytes(32).toString('hex')
}