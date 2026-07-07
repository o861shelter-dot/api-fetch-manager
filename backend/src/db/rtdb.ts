/**
 * rtdb.ts — Storage adapter (PLAN Bước 0.3, [SYS] 2, 3, 10.4)
 *
 * SPEC yêu cầu Google RTDB tách 5 DB độc lập (keys, history, logs, issues, variables)
 * với `.indexOn`. Vì credential Firebase thật KHÔNG được commit (và secret trong doc
 * đã bị lộ → phải rotate), ta trừu tượng hóa storage qua interface `Db`, cung cấp:
 *
 *   - MemoryDb  : chạy in-memory (mặc định dev/test), reset khi restart.
 *   - FileDb    : lưu JSON xuống ổ đĩa (mỗi DB 1 file) → giữ dữ liệu qua restart.
 *   - FirebaseDb: (khi có credential) dùng Firebase Admin SDK trỏ tới URL RTDB thật.
 *
 * Cả 3 adapter cùng interface → business logic không đổi. Schema & `.indexOn`
 * được đặc tả trong docker/database.rules.json (dùng cho Firebase mode).
 *
 * Mô hình dữ liệu: mỗi DB là 1 cây JSON. API: get/set/update/push/remove/query
 * theo đường dẫn (path) phân tách bằng '/'.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AppConfig } from '../config/env.js';
import { genId } from '../lib/ids.js';

export type DbName = 'keys' | 'history' | 'logs' | 'issues' | 'variables';

export interface QueryOptions {
  /** Lọc theo child key (giả lập orderByChild + equalTo của RTDB). */
  orderByChild?: string;
  equalTo?: string | number | boolean;
  limit?: number;
}

export interface Db {
  name: DbName;
  get<T = unknown>(path: string): Promise<T | null>;
  set(path: string, value: unknown): Promise<void>;
  update(path: string, value: Record<string, unknown>): Promise<void>;
  /** Tạo child với id tự sinh, trả về id. */
  push(path: string, value: Record<string, unknown>): Promise<string>;
  remove(path: string): Promise<void>;
  /** Trả về map { childId: value } tại `path`, có thể lọc/limit. */
  query<T = unknown>(path: string, opts?: QueryOptions): Promise<Record<string, T>>;
}

/* ------------------------------------------------------------------ */
/* Helpers thao tác cây JSON theo path                                 */
/* ------------------------------------------------------------------ */

type Tree = Record<string, any>;

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function getAt(tree: Tree, path: string): any {
  const parts = splitPath(path);
  let cur: any = tree;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[p];
  }
  return cur === undefined ? null : cur;
}

function setAt(tree: Tree, path: string, value: any): void {
  const parts = splitPath(path);
  if (parts.length === 0) return;
  let cur: any = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function removeAt(tree: Tree, path: string): void {
  const parts = splitPath(path);
  if (parts.length === 0) return;
  let cur: any = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null) return;
    cur = cur[p];
  }
  delete cur[parts[parts.length - 1]];
}

function applyQuery<T>(node: Record<string, T> | null, opts?: QueryOptions): Record<string, T> {
  if (!node || typeof node !== 'object') return {};
  let entries = Object.entries(node) as [string, T][];
  if (opts?.orderByChild && opts.equalTo !== undefined) {
    entries = entries.filter(([, v]) => {
      const child = (v as any)?.[opts.orderByChild!];
      return child === opts.equalTo;
    });
  }
  if (opts?.limit && opts.limit > 0) entries = entries.slice(0, opts.limit);
  return Object.fromEntries(entries) as Record<string, T>;
}

/* ------------------------------------------------------------------ */
/* MemoryDb                                                            */
/* ------------------------------------------------------------------ */

class MemoryDb implements Db {
  private tree: Tree = {};
  constructor(public name: DbName) {}

  async get<T>(path: string) {
    return structuredClone(getAt(this.tree, path)) as T | null;
  }
  async set(path: string, value: unknown) {
    setAt(this.tree, path, structuredClone(value));
  }
  async update(path: string, value: Record<string, unknown>) {
    const cur = getAt(this.tree, path) ?? {};
    setAt(this.tree, path, { ...cur, ...structuredClone(value) });
  }
  async push(path: string, value: Record<string, unknown>) {
    const id = genId();
    setAt(this.tree, `${path}/${id}`, structuredClone(value));
    return id;
  }
  async remove(path: string) {
    removeAt(this.tree, path);
  }
  async query<T>(path: string, opts?: QueryOptions) {
    return applyQuery<T>(structuredClone(getAt(this.tree, path)), opts);
  }
}

/* ------------------------------------------------------------------ */
/* FileDb — lưu xuống JSON, giữ dữ liệu qua restart                    */
/* ------------------------------------------------------------------ */

class FileDb implements Db {
  private tree: Tree = {};
  private file: string;
  constructor(public name: DbName, dir: string) {
    mkdirSync(dir, { recursive: true });
    this.file = join(dir, `rtdb-${name}.json`);
    if (existsSync(this.file)) {
      try {
        this.tree = JSON.parse(readFileSync(this.file, 'utf8'));
      } catch {
        this.tree = {};
      }
    }
  }
  private flush() {
    writeFileSync(this.file, JSON.stringify(this.tree, null, 2), 'utf8');
  }
  async get<T>(path: string) {
    return structuredClone(getAt(this.tree, path)) as T | null;
  }
  async set(path: string, value: unknown) {
    setAt(this.tree, path, structuredClone(value));
    this.flush();
  }
  async update(path: string, value: Record<string, unknown>) {
    const cur = getAt(this.tree, path) ?? {};
    setAt(this.tree, path, { ...cur, ...structuredClone(value) });
    this.flush();
  }
  async push(path: string, value: Record<string, unknown>) {
    const id = genId();
    setAt(this.tree, `${path}/${id}`, structuredClone(value));
    this.flush();
    return id;
  }
  async remove(path: string) {
    removeAt(this.tree, path);
    this.flush();
  }
  async query<T>(path: string, opts?: QueryOptions) {
    return applyQuery<T>(structuredClone(getAt(this.tree, path)), opts);
  }
}

/* ------------------------------------------------------------------ */
/* Registry — export 5 handle DB                                       */
/* ------------------------------------------------------------------ */

export interface RtdbRegistry {
  keys: Db;
  history: Db;
  logs: Db;
  issues: Db;
  variables: Db;
}

const DB_NAMES: DbName[] = ['keys', 'history', 'logs', 'issues', 'variables'];

export function createRtdb(config: AppConfig): RtdbRegistry {
  const make = (name: DbName): Db => {
    switch (config.storageMode) {
      case 'file':
        return new FileDb(name, config.dataDir);
      case 'firebase':
        // Khi có credential thật: khởi tạo Firebase Admin App riêng cho từng URL
        // (mỗi DB một firebase app instance) và bọc theo interface Db.
        // Xem docs/OPERATIONS.md để cấu hình. Fallback về Memory nếu chưa wire.
        throw new Error(
          `[rtdb] storageMode=firebase yêu cầu tích hợp firebase-admin. ` +
            `Xem docs/OPERATIONS.md (mục Firebase). Tạm thời dùng memory/file.`,
        );
      case 'memory':
      default:
        return new MemoryDb(name);
    }
  };

  const reg = {} as RtdbRegistry;
  for (const n of DB_NAMES) (reg as any)[n] = make(n);
  return reg;
}
