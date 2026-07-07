/**
 * parse-curl.ts — Parse lệnh curl thành template (PLAN Bước 1.4, [SYS] 5)
 *
 * Tách: method, url, headers, body. Tự phát hiện header Authorization để gợi ý
 * map credential → placeholder. Trả về 1 step khởi tạo (single-step template).
 */

import type { FlowStep, CredentialRef } from '../lib/types.js';
import { genId } from '../lib/ids.js';

export interface ParsedCurl {
  step: FlowStep;
  credentialRefs: CredentialRef[];
  detected: { authHeader?: string };
}

/** Tokenize tôn trọng dấu nháy đơn/kép và line-continuation `\`. */
function tokenize(cmd: string): string[] {
  const clean = cmd.replace(/\\\r?\n/g, ' ').trim();
  const tokens: string[] = [];
  let cur = '';
  let quote: string | null = null;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

export function parseCurl(cmd: string): ParsedCurl {
  const tokens = tokenize(cmd);
  let method = '';
  let url = '';
  const headers: Record<string, string> = {};
  let body = '';

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'curl') continue;
    if (t === '-X' || t === '--request') {
      method = (tokens[++i] ?? '').toUpperCase();
    } else if (t === '-H' || t === '--header') {
      const h = tokens[++i] ?? '';
      const idx = h.indexOf(':');
      if (idx > -1) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
      body = tokens[++i] ?? '';
    } else if (t === '-u' || t === '--user') {
      const creds = tokens[++i] ?? '';
      headers['Authorization'] = 'Basic ' + Buffer.from(creds).toString('base64');
    } else if (t.startsWith('http://') || t.startsWith('https://')) {
      url = t;
    } else if (!t.startsWith('-') && !url) {
      url = t;
    }
  }

  if (!method) method = body ? 'POST' : 'GET';

  // Phát hiện Authorization → gợi ý map credential.
  const credentialRefs: CredentialRef[] = [];
  let authHeader: string | undefined;
  if (headers['Authorization']) {
    authHeader = headers['Authorization'];
    const m = authHeader.match(/^(Bearer|token)\s+(.+)$/i);
    const scheme = m ? m[1] : '';
    // Thay token thật bằng placeholder chung; gợi ý key mặc định.
    headers['Authorization'] = scheme ? `${scheme} {{auth.token}}` : `{{auth.token}}`;
    credentialRefs.push({ placeholder: 'auth.token', key: 'auth.token' });
  }

  const step: FlowStep = {
    id: genId('step_'),
    method,
    urlTemplate: url,
    headers,
    bodyTemplate: body || undefined,
    extract: [],
  };

  return { step, credentialRefs, detected: { authHeader } };
}
