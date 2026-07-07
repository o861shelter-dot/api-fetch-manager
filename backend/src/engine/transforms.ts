/**
 * transforms.ts — Placeholder transform whitelist (PLAN Bước 1.2, [SYS] 10.6, [REQ] 7.4)
 *
 * Whitelist bắt buộc: upper, lower, trim, replace(a,b), slice(a,b), base64,
 * base64decode, jsonStringify, urlEncode, date(format), default(x).
 */

export type TransformFn = (value: string, ...args: string[]) => string;

function fmtDate(d: Date, format: string): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m] ?? m);
}

export const transforms: Record<string, TransformFn> = {
  upper: (v) => v.toUpperCase(),
  lower: (v) => v.toLowerCase(),
  trim: (v) => v.trim(),
  replace: (v, a = '', b = '') => v.split(a).join(b),
  slice: (v, a = '0', b) => v.slice(Number(a), b === undefined ? undefined : Number(b)),
  base64: (v) => Buffer.from(v, 'utf8').toString('base64'),
  base64decode: (v) => Buffer.from(v, 'base64').toString('utf8'),
  jsonStringify: (v) => JSON.stringify(v),
  urlEncode: (v) => encodeURIComponent(v),
  date: (v, format = 'YYYY-MM-DD') => {
    const d = v ? new Date(v) : new Date();
    return fmtDate(isNaN(d.getTime()) ? new Date() : d, format);
  },
  default: (v, fallback = '') => (v === '' || v == null ? fallback : v),
};

export function isTransform(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(transforms, name);
}

export function listTransforms(): string[] {
  return Object.keys(transforms);
}

function splitTransformArgs(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: string | null = null;
  let quoted = false;
  const flush = () => {
    out.push(quoted ? cur : cur.trim());
    cur = '';
    quoted = false;
  };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      quoted = true;
      cur = '';
    } else if (ch === ',') {
      flush();
    } else {
      cur += ch;
    }
  }
  flush();
  return out;
}

/** Parse 1 segment pipe: `replace(" ", "-")` → { name, args }. */
export function parseTransformCall(seg: string): { name: string; args: string[] } {
  const m = seg.trim().match(/^(\w+)\s*(?:\((.*)\))?$/s);
  if (!m) return { name: seg.trim(), args: [] };
  const name = m[1];
  const argStr = m[2];
  if (!argStr || !argStr.trim()) return { name, args: [] };
  return { name, args: splitTransformArgs(argStr) };
}

export function applyTransform(name: string, value: string, args: string[]): string {
  const fn = transforms[name];
  if (!fn) throw new Error(`Transform không hợp lệ: "${name}". Whitelist: ${listTransforms().join(', ')}`);
  return fn(value, ...args);
}
