/**
 * crypto.ts — Mã hóa credential at-rest (PLAN Bước 0.3, [SYS] 7.1)
 *
 * AES-256-GCM. Khóa 32 byte lấy từ config. Mỗi lần encrypt sinh IV ngẫu nhiên.
 * Ciphertext lưu kèm authTag để chống giả mạo.
 *
 * Định dạng lưu: { valueEnc: base64(ciphertext+authTag), iv: base64(iv) }
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // 96-bit IV chuẩn cho GCM
const TAG_LEN = 16;

export interface EncryptedValue {
  valueEnc: string; // base64(ciphertext || authTag)
  iv: string; // base64(iv)
}

export function encrypt(plaintext: string, key: Buffer): EncryptedValue {
  if (key.length !== 32) throw new Error('encrypt: key phải 32 byte (AES-256).');
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    valueEnc: Buffer.concat([enc, tag]).toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decrypt(payload: EncryptedValue, key: Buffer): string {
  if (key.length !== 32) throw new Error('decrypt: key phải 32 byte (AES-256).');
  const iv = Buffer.from(payload.iv, 'base64');
  const raw = Buffer.from(payload.valueEnc, 'base64');
  const tag = raw.subarray(raw.length - TAG_LEN);
  const data = raw.subarray(0, raw.length - TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * Masked hiển thị an toàn cho FE: giữ prefix + 5 ký tự cuối.
 * Ví dụ: "ghp_HKMdo...774ANR1M" → "ghp_****4ANR1M"
 */
export function maskSecret(plaintext: string): string {
  if (!plaintext) return '';
  if (plaintext.length <= 8) return '****';
  const head = plaintext.slice(0, 4);
  const tail = plaintext.slice(-5);
  return `${head}****${tail}`;
}
