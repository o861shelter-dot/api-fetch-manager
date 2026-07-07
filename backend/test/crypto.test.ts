import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, maskSecret } from '../src/lib/crypto.js';
import { randomBytes } from 'node:crypto';

describe('crypto AES-256-GCM', () => {
  const key = randomBytes(32);

  it('encrypt→decrypt round-trip', () => {
    const plain = 'ghp_super_secret_token_123';
    const enc = encrypt(plain, key);
    expect(enc.valueEnc).not.toContain(plain);
    expect(decrypt(enc, key)).toBe(plain);
  });

  it('mỗi lần encrypt sinh IV khác nhau', () => {
    const a = encrypt('x', key);
    const b = encrypt('x', key);
    expect(a.iv).not.toBe(b.iv);
    expect(a.valueEnc).not.toBe(b.valueEnc);
  });

  it('sai key → decrypt ném lỗi', () => {
    const enc = encrypt('secret', key);
    expect(() => decrypt(enc, randomBytes(32))).toThrow();
  });

  it('key không đủ 32 byte → ném lỗi', () => {
    expect(() => encrypt('x', randomBytes(16))).toThrow();
  });

  it('maskSecret giữ prefix + đuôi', () => {
    expect(maskSecret('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')).toBe('ghp_****ANR1M');
    expect(maskSecret('short')).toBe('****');
  });
});
