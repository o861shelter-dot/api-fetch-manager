/**
 * ids.ts — Sinh id & timestamp dùng chung.
 */
import { randomBytes } from 'node:crypto';

export function now(): number {
  return Date.now();
}

/** id ngắn, sắp xếp được theo thời gian (giống push-id Firebase, đơn giản hóa). */
export function genId(prefix = ''): string {
  const t = Date.now().toString(36);
  const r = randomBytes(6).toString('hex');
  return `${prefix}${t}${r}`;
}
