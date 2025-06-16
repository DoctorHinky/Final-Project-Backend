import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.CHAT_KEY!, 'hex'); // 32-byte key
const ivLength = 16; // AES block size

export function encrypt(text: string): string {
  console.log('Encrypting message:', text);
  try {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    console.log('Encrypted message:', encrypted);

    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return 'nicht verschlüsselbar';
  }
}

export function decrypt(encrypted: string): string {
  try {
    console.log('Decrypting message:', encrypted);

    const [ivHex, data] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const deciphered = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = deciphered.update(data, 'hex', 'utf-8');
    decrypted += deciphered.final('utf-8');
    console.log('Decrypted message:', decrypted);
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'nicht entschlüsselbar';
  }
}
