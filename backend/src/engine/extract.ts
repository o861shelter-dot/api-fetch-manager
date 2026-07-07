/**
 * extract.ts — JSONPath extraction (PLAN Bước 1.5, [SYS] 10.2)
 *
 * Hỗ trợ: nested (`$.a.b.c`), mảng theo index (`$.items[0]`),
 * wildcard map nhiều giá trị (`$.items[*].id`).
 * Trả về giá trị đơn hoặc mảng (khi có wildcard hoặc index-all).
 */

type Json = any;

interface Token {
  type: 'key' | 'index' | 'wildcard';
  value?: string | number;
}

/** Parse `$.data.items[0].id` / `$.items[*].id` thành token list. */
export function parseJsonPath(path: string): Token[] {
  let p = path.trim();
  if (p.startsWith('$')) p = p.slice(1);
  if (p.startsWith('.')) p = p.slice(1);
  const tokens: Token[] = [];
  const re = /([^.[\]]+)|\[(\*|\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(p)) !== null) {
    if (m[1] !== undefined) {
      tokens.push({ type: 'key', value: m[1] });
    } else if (m[2] !== undefined) {
      if (m[2] === '*') tokens.push({ type: 'wildcard' });
      else tokens.push({ type: 'index', value: Number(m[2]) });
    }
  }
  return tokens;
}

function walk(node: Json, tokens: Token[], i: number): Json {
  if (i >= tokens.length) return node;
  if (node == null) return undefined;
  const t = tokens[i];
  if (t.type === 'key') {
    return walk(node[t.value as string], tokens, i + 1);
  }
  if (t.type === 'index') {
    if (!Array.isArray(node)) return undefined;
    return walk(node[t.value as number], tokens, i + 1);
  }
  // wildcard → map qua từng phần tử mảng (hoặc value của object)
  const arr = Array.isArray(node) ? node : typeof node === 'object' ? Object.values(node) : [];
  const out = arr.map((el) => walk(el, tokens, i + 1)).filter((v) => v !== undefined);
  return out;
}

/**
 * Trích giá trị theo JSONPath. Có wildcard → luôn trả mảng.
 */
export function extractJsonPath(data: Json, path: string): Json {
  const tokens = parseJsonPath(path);
  const hasWildcard = tokens.some((t) => t.type === 'wildcard');
  const res = walk(data, tokens, 0);
  if (hasWildcard) return Array.isArray(res) ? res : res === undefined ? [] : [res];
  return res;
}

export interface ExtractRule {
  field: string;
  jsonPath: string;
  pinToVar?: string;
}

export interface ExtractResult {
  values: Record<string, Json>;
  /** field → varKey cần pin */
  pins: { field: string; varKey: string; value: Json }[];
}

export function runExtract(data: Json, rules: ExtractRule[]): ExtractResult {
  const values: Record<string, Json> = {};
  const pins: ExtractResult['pins'] = [];
  for (const r of rules) {
    const v = extractJsonPath(data, r.jsonPath);
    values[r.field] = v;
    if (r.pinToVar) pins.push({ field: r.field, varKey: r.pinToVar, value: v });
  }
  return { values, pins };
}
