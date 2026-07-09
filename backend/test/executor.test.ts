import { describe, it, expect, beforeEach } from 'vitest';
import { createContext, type AppContext } from '../src/context.js';
import { executeFlow } from '../src/engine/executor.js';
import * as store from '../src/modules/stores.js';
import type { FetchTemplate } from '../src/lib/types.js';

// Storage memory mặc định, key tạm được sinh trong config.
process.env.API_FETCH_MANAGER_STORAGE_MODE = 'memory';

function mockFetch(routes: Record<string, { status: number; body: any }>): typeof fetch {
  return (async (url: string) => {
    const r = routes[url] ?? { status: 404, body: { error: 'not found' } };
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => JSON.stringify(r.body),
    } as any;
  }) as any;
}

describe('executeFlow — sequential 2-step', () => {
  let ctx: AppContext;
  let ownerId: string;

  beforeEach(async () => {
    ctx = createContext();
    const owner = await store.createOwner(ctx, 'test@example.com');
    ownerId = owner.id;
    await store.addCredential(ctx, ownerId, { key: 'org.token', value: 'seed_token', service: 'example.com' });
  });

  it('step 2 dùng output step 1 qua {{ctx.auth.accessToken}} + pinToVar', async () => {
    const tpl: FetchTemplate = {
      id: 'flow1',
      name: 'Auth rồi tạo repo',
      service: 'github.com',
      business: 'create-repo',
      stopOnError: true,
      inputs: [
        { name: 'repoName', required: true, source: 'runtime' },
        { name: 'orgToken', source: 'store', varKey: 'orgToken' },
      ],
      credentialRefs: [{ placeholder: 'org.token', key: 'org.token' }],
      steps: [
        {
          id: 'auth',
          method: 'POST',
          urlTemplate: 'https://api.example.com/oauth/token',
          headers: { Authorization: 'Bearer {{org.token}}' },
          bodyTemplate: '{}',
          extract: [{ field: 'accessToken', jsonPath: '$.access_token' }],
        },
        {
          id: 'createRepo',
          method: 'POST',
          urlTemplate: 'https://api.github.com/user/repos',
          headers: { Authorization: 'Bearer {{ctx.auth.accessToken}}' },
          bodyTemplate: '{"name":"{{repoName | lower}}"}',
          extract: [{ field: 'repoUrl', jsonPath: '$.html_url', pinToVar: 'github.lastRepoUrl' }],
        },
      ],
      createdAt: 0,
      updatedAt: 0,
    };

    const fetchImpl = mockFetch({
      'https://api.example.com/oauth/token': { status: 200, body: { access_token: 'AT_123' } },
      'https://api.github.com/user/repos': { status: 201, body: { html_url: 'https://github.com/u/demo' } },
    });

    const res = await executeFlow(ctx, { ownerId, template: tpl, runtimeInputs: { repoName: 'My Demo' } }, fetchImpl);

    expect(res.ok).toBe(true);
    expect(res.steps).toHaveLength(2);
    expect(res.steps[0].extracted?.accessToken).toBe('AT_123');
    expect(res.steps[1].extracted?.repoUrl).toBe('https://github.com/u/demo');

    // pinToVar ghi vào rtdb-variables (owner scope)
    const vars = await store.listVariables(ctx, ownerId);
    expect(vars['github.lastRepoUrl'].value).toBe('https://github.com/u/demo');
    expect(vars['github.lastRepoUrl'].source).toBe('extracted');

    // history có 2 entry
    const hist = await store.listHistory(ctx, ownerId);
    expect(hist).toHaveLength(2);

    // extraction record được lưu
    const ex = await store.listExtractions(ctx, { ownerId });
    expect(ex.length).toBeGreaterThanOrEqual(2);
  });



  it('retry HTTP 5xx rồi thành công theo policy', async () => {
    const tpl: FetchTemplate = {
      id: 'flow-retry',
      name: 'retry',
      service: 'example.com',
      business: 'retry',
      stopOnError: true,
      steps: [{ id: 's1', method: 'GET', urlTemplate: 'https://api.example.com/flaky' }],
      createdAt: 0,
      updatedAt: 0,
    };
    ctx.config.httpRetries = 1;
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      const status = calls === 1 ? 503 : 200;
      return {
        ok: status === 200,
        status,
        headers: new Headers(),
        text: async () => JSON.stringify({ ok: true, calls }),
      } as any;
    }) as typeof fetch;

    const res = await executeFlow(ctx, { ownerId, template: tpl }, fetchImpl);

    expect(res.ok).toBe(true);
    expect(calls).toBe(2);
    expect(res.steps[0].status).toBe(200);
  });

  it('timeout HTTP được ghi thành lỗi step', async () => {
    const tpl: FetchTemplate = {
      id: 'flow-timeout',
      name: 'timeout',
      service: 'example.com',
      business: 'timeout',
      stopOnError: true,
      steps: [{ id: 's1', method: 'GET', urlTemplate: 'https://api.example.com/slow' }],
      createdAt: 0,
      updatedAt: 0,
    };
    ctx.config.httpRetries = 0;
    ctx.config.httpTimeoutMs = 5;
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      await new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          reject(e);
        });
      });
      throw new Error('unreachable');
    }) as typeof fetch;

    const res = await executeFlow(ctx, { ownerId, template: tpl }, fetchImpl);

    expect(res.ok).toBe(false);
    expect(res.steps[0].error).toContain('timeout');
  });

  it('stopOnError: step lỗi → dừng + ghi log, không log plaintext token', async () => {
    const tpl: FetchTemplate = {
      id: 'flow2',
      name: 'fail',
      service: 'github.com',
      business: 'create-repo',
      stopOnError: true,
      credentialRefs: [{ placeholder: 'org.token', key: 'org.token' }],
      steps: [
        {
          id: 's1',
          method: 'POST',
          urlTemplate: 'https://api.example.com/fail',
          headers: { Authorization: 'Bearer {{org.token}}' },
        },
      ],
      createdAt: 0,
      updatedAt: 0,
    };
    const fetchImpl = mockFetch({ 'https://api.example.com/fail': { status: 401, body: { error: 'unauthorized' } } });
    const res = await executeFlow(ctx, { ownerId, template: tpl }, fetchImpl);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/dừng/);

    const logs = await store.listLogs(ctx, { level: 'error' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    // token bị che, không lộ plaintext 'seed_token'
    const logStr = JSON.stringify(logs);
    expect(logStr).not.toContain('seed_token');
  });

  it('HTTP lỗi có response excerpt; REDACT_EXECUTION_VALUES=false vẫn không log credential đã lưu', async () => {
    const tpl: FetchTemplate = {
      id: 'flow-debug',
      name: 'debug fail',
      service: 'github.com',
      business: 'get-user',
      stopOnError: true,
      credentialRefs: [{ placeholder: 'org.token', key: 'org.token' }],
      steps: [
        {
          id: 'me',
          method: 'GET',
          urlTemplate: 'https://api.github.com/user',
          headers: { Authorization: 'Bearer {{org.token}}', 'X-Debug': 'Bearer visible_debug_value' },
        },
      ],
      createdAt: 0,
      updatedAt: 0,
    };
    ctx.config.redactExecutionValues = false;
    const fetchImpl = mockFetch({
      'https://api.github.com/user': { status: 401, body: { message: 'Bad credentials', echo: 'Bearer visible_debug_value seed_token' } },
    });

    const res = await executeFlow(ctx, { ownerId, template: tpl }, fetchImpl);

    expect(res.ok).toBe(false);
    expect(res.steps[0].error).toContain('HTTP 401');
    expect(res.steps[0].error).toContain('Bad credentials');
    const logs = await store.listLogs(ctx, { level: 'error' });
    const logStr = JSON.stringify(logs);
    expect(logStr).toContain('visible_debug_value');
    expect(logStr).not.toContain('seed_token');
  });

  it('B3 — key trùng: chưa chọn credId → resolve lỗi; chọn credId A/B → resolve đúng', async () => {
    // 2 credential cùng key github.token, giá trị khác nhau.
    const credA = await store.addCredential(ctx, ownerId, { key: 'github.token', value: 'VALUE_A', service: 'github.com', label: 'A' });
    const credB = await store.addCredential(ctx, ownerId, { key: 'github.token', value: 'VALUE_B', service: 'github.com', label: 'B' });

    // (a) không credId + key trùng → errors
    const ambiguous = await store.resolveCredentialsByRefs(ctx, ownerId, [{ placeholder: 'github.token', key: 'github.token' }]);
    expect(ambiguous.errors.length).toBe(1);
    expect(ambiguous.credentials['github.token']).toBeUndefined();

    // (b) chọn credId A → VALUE_A
    const pickA = await store.resolveCredentialsByRefs(ctx, ownerId, [{ placeholder: 'github.token', key: 'github.token', credId: credA.id }]);
    expect(pickA.errors).toHaveLength(0);
    expect(pickA.credentials['github.token']).toBe('VALUE_A');

    // (c) chọn credId B → VALUE_B
    const pickB = await store.resolveCredentialsByRefs(ctx, ownerId, [{ placeholder: 'github.token', key: 'github.token', credId: credB.id }]);
    expect(pickB.credentials['github.token']).toBe('VALUE_B');

    // (d) key duy nhất 1 giá trị (org.token seed) → fallback không cần credId
    const single = await store.resolveCredentialsByRefs(ctx, ownerId, [{ placeholder: 'org.token', key: 'org.token' }]);
    expect(single.errors).toHaveLength(0);
    expect(single.credentials['org.token']).toBe('seed_token');
  });

  it('B3 — executeFlow dừng khi key trùng chưa chọn credId', async () => {
    await store.addCredential(ctx, ownerId, { key: 'dup.token', value: 'X1', service: 'x.com' });
    await store.addCredential(ctx, ownerId, { key: 'dup.token', value: 'X2', service: 'x.com' });
    const tpl: FetchTemplate = {
      id: 'flow-dup',
      name: 'dup', service: 'x.com', business: 'get', stopOnError: true,
      credentialRefs: [{ placeholder: 'dup.token', key: 'dup.token' }],
      steps: [{ id: 's1', method: 'GET', urlTemplate: 'https://x.com/api', headers: { Authorization: 'Bearer {{dup.token}}' } }],
      createdAt: 0, updatedAt: 0,
    };
    const res = await executeFlow(ctx, { ownerId, template: tpl }, mockFetch({ 'https://x.com/api': { status: 200, body: {} } }));
    expect(res.ok).toBe(false);
    expect(res.error).toContain('credId');
    expect(res.steps).toHaveLength(0);
  });
});
