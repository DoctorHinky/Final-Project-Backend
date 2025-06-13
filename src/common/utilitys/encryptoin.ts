import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.CHAT_KEY!, 'hex'); // 32-byte key
const ivLength = 16; // AES block size

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, data] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const deciphered = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = deciphered.update(data, 'hex', 'utf-8');
  decrypted += deciphered.final('utf-8');
  return decrypted;
}
