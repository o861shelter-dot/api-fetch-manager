/** api.ts — Client gọi backend. Response chuẩn { ok, data?, error? }. */

const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({ ok: false, error: 'Phản hồi không hợp lệ' }));
  if (!json.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data as T;
}

export const api = {
  get: <T>(p: string) => req<T>('GET', p),
  post: <T>(p: string, b?: unknown) => req<T>('POST', p, b),
  put: <T>(p: string, b?: unknown) => req<T>('PUT', p, b),
  del: <T>(p: string, b?: unknown) => req<T>('DELETE', p, b),
};

/* ------- Domain types (khớp backend) ------- */
export interface Owner {
  id: string;
  email: string;
  isSaveRtdbEmail: boolean;
  createdAt: number;
}
export interface CredentialMasked {
  id: string;
  key: string;
  service: string;
  label?: string;
  masked: string;
  createdAt: number;
}
export interface FlowStep {
  id: string;
  method: string;
  urlTemplate: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  extract?: { field: string; jsonPath: string; pinToVar?: string }[];
}
export interface FlowInput {
  name: string;
  required?: boolean;
  source: 'runtime' | 'store' | 'context';
  varKey?: string;
  ref?: string;
}
export interface FetchTemplate {
  id: string;
  name: string;
  service: string;
  business: string;
  stopOnError?: boolean;
  inputs?: FlowInput[];
  credentialRefs?: { placeholder: string; key: string }[];
  steps: FlowStep[];
  createdAt: number;
  updatedAt: number;
}
export interface HistoryEntry {
  id: string;
  service: string;
  method: string;
  url: string;
  responseStatus: number;
  responseSummary: string;
  durationMs: number;
  success: boolean;
  calledAt: number;
  stepId?: string;
}
export interface LogEntry {
  id: string;
  level: string;
  scope: string;
  service: string;
  business: string;
  message: string;
  detail?: Record<string, unknown>;
  createdAt: number;
}
export interface Issue {
  id: string;
  type: 'bug' | 'feature' | 'task';
  title: string;
  description?: string;
  expectedResult?: string;
  elements?: { selector: string; outerHTML: string; boundingRect?: Record<string, number> }[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: number;
  updatedAt: number;
}
export interface Variable {
  value: unknown;
  updatedAt: number;
  source: 'manual' | 'extracted';
}
export interface ExtractionRecord {
  id: string;
  ownerId: string;
  service: string;
  templateId: string;
  templateName: string;
  field: string;
  value: unknown;
  jsonPath: string;
  createdAt: number;
}
