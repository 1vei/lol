const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

export function encrypt(text: string): string {
  const buffer = Buffer.from(text, 'utf8')
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  
  const encrypted = Buffer.alloc(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    encrypted[i] = buffer[i] ^ key[i % key.length]
  }
  
  return encrypted.toString('base64')
}

export function decrypt(encryptedText: string): string {
  try {
    const buffer = Buffer.from(encryptedText, 'base64')
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
    
    const decrypted = Buffer.alloc(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      decrypted[i] = buffer[i] ^ key[i % key.length]
    }
    
    return decrypted.toString('utf8')
  } catch {
    return '[Decryption failed]'
  }
}
