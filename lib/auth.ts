import crypto from 'crypto'

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH
  
  if (!hash) {
    console.error('ADMIN_PASSWORD_HASH not set!')
    return false
  }
  
  const inputHash = crypto.createHash('sha256').update(password).digest('hex')
  return inputHash === hash
}

export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex')
}
