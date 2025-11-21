import crypto from 'crypto';
import { env } from '../config/env';

export const signPayload = (payload: string) =>
  crypto.createHmac('sha256', env.deviceHmacSecret).update(payload).digest('hex');

export const encryptPayload = (plaintext: string, iv = crypto.randomBytes(16)) => {
  const key = Buffer.from(env.deviceAesSecret, 'utf8');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return { iv: iv.toString('base64'), ciphertext: encrypted };
};

export const decryptPayload = (ciphertext: string, iv: string) => {
  const key = Buffer.from(env.deviceAesSecret, 'utf8');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
