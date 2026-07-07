/**
 * placeholder.ts — Placeholder Engine (PLAN Bước 1.2, [SYS] 10.6, [REQ] 7.4)
 *
 * Cú pháp: {{ source | transform1 | transform2(arg) }}
 *   - source: credential key, var.<key>, ctx.<stepId>.<field>, input.<name>,
 *             hoặc tên trực tiếp.
 *   - Advanced JS: {{= <biểu thức JS> }} chạy trong sandbox.
 *
 * Resolve order: credential refs → variables → context → inputs → transforms.
 * Lưu ý: key của credential/var thường là flat dotted string (vd "github.token",
 * "github.lastRepoUrl") → khi resolve var./ctx./input. ta thử flat key trước,
 * sau đó mới path traversal.
 */

import { applyTransform, parseTransformCall } from './transforms.js';
import { runSandbox } from './sandbox.js';

export interface ResolveScope {
  credentials?: Record<string, string>;
  vars?: Record<string, unknown>;
  ctx?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
}

const PLACEHOLDER_RE = /\{\{\s*([\s\S]*?)\s*\}\}/g;

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Thử flat key (chứa dấu chấm) trước; nếu không có → path traversal. */
function getFlatOrPath(obj: unknown, key: string): unknown {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[key];
  }
  return getPath(obj, key);
}

function stringify(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function resolveSource(src: string, scope: ResolveScope): unknown {
  src = src.trim();

  // Advanced JS: {{= expr }}
  if (src.startsWith('=')) {
    return runSandbox(src.slice(1).trim(), {
      ctx: scope.ctx,
      inputs: scope.inputs,
      vars: scope.vars,
    });
  }

  if (src.startsWith('var.')) return getFlatOrPath(scope.vars, src.slice(4));
  if (src.startsWith('ctx.')) return getFlatOrPath(scope.ctx, src.slice(4));
  if (src.startsWith('input.')) return getFlatOrPath(scope.inputs, src.slice(6));

  // Resolve order: credential → var → ctx → input → (tên trực tiếp).
  if (scope.credentials && src in scope.credentials) return scope.credentials[src];
  if (scope.vars && src in scope.vars) return scope.vars[src];
  if (scope.ctx && src in scope.ctx) return scope.ctx[src];
  if (scope.inputs && src in scope.inputs) return scope.inputs[src];
  return undefined;
}

/** Resolve 1 biểu thức placeholder (đã bỏ {{ }}). */
export function resolveExpression(expr: string, scope: ResolveScope): string {
  const segments = splitPipes(expr);
  let str = stringify(resolveSource(segments[0], scope));
  for (let i = 1; i < segments.length; i++) {
    const { name, args } = parseTransformCall(segments[i]);
    str = applyTransform(name, str, args);
  }
  return str;
}

/** Tách pipe nhưng KHÔNG tách dấu | nằm trong ngoặc/nháy. */
function splitPipes(expr: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  let quote: string | null = null;
  for (const ch of expr) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '|' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Thay toàn bộ placeholder trong 1 template string. */
export function resolveTemplate(template: string, scope: ResolveScope): string {
  if (!template) return template;
  return template.replace(PLACEHOLDER_RE, (_full, expr) => resolveExpression(String(expr), scope));
}

/** Resolve đệ quy cho object (headers/body dạng object). */
export function resolveDeep<T>(value: T, scope: ResolveScope): T {
  if (typeof value === 'string') return resolveTemplate(value, scope) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => resolveDeep(v, scope)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveDeep(v, scope);
    return out as T;
  }
  return value;
}
