/**
 * seed-smoke.ts — Seed dữ liệu mẫu (PLAN Bước 4.3).
 * ⚠️ CHỈ dùng dữ liệu GIẢ. KHÔNG dùng secret thật đã lộ trong doc.
 *
 * Chạy: npm run seed  (mặc định storage=file để giữ dữ liệu qua restart)
 */
import { createContext } from '../src/context.js';
import * as store from '../src/modules/stores.js';

async function main() {
  const ctx = createContext();
  console.log(`[seed] storage=${ctx.config.storageMode}`);

  // 1. Owner mẫu
  const owner = await store.createOwner(ctx, 'demo.owner@example.com');
  console.log(`[seed] owner: ${owner.email} (${owner.id})`);

  // 2. Credential GIẢ (không phải secret thật)
  await store.addCredential(ctx, owner.id, { key: 'github.token', value: 'ghp_FAKE_DEMO_0000000000000000', service: 'github.com', label: 'demo' });
  await store.addCredential(ctx, owner.id, { key: 'github.token', value: 'ghp_FAKE_DEMO_1111111111111111', service: 'github.com', label: 'demo-2' });
  await store.addCredential(ctx, owner.id, { key: 'cloudflare.token', value: 'cf_FAKE_DEMO_2222', service: 'cloudflare.com' });
  console.log('[seed] credentials: 3 (2 giá trị cho github.token)');

  // 3. Biến mẫu
  await store.setVariable(ctx, 'global', 'api.base', 'https://api.example.com', 'manual');
  await store.setVariable(ctx, owner.id, 'github.org', 'demo-org', 'manual');

  // 4. Template flow mẫu (2 step: auth → tạo repo) — dùng httpbin để chạy thật được
  await store.saveTemplate(ctx, {
    name: 'Demo - Echo 2 step',
    service: 'httpbin.org',
    business: 'demo-echo',
    stopOnError: true,
    inputs: [{ name: 'repoName', required: true, source: 'runtime' }],
    credentialRefs: [{ placeholder: 'github.token', key: 'github.token' }],
    steps: [
      {
        id: 'auth',
        method: 'POST',
        urlTemplate: 'https://httpbin.org/anything',
        headers: { 'Content-Type': 'application/json' },
        bodyTemplate: '{"token":"{{github.token}}"}',
        extract: [{ field: 'echoedToken', jsonPath: '$.json.token' }],
      },
      {
        id: 'createRepo',
        method: 'POST',
        urlTemplate: 'https://httpbin.org/anything',
        headers: { 'Content-Type': 'application/json' },
        bodyTemplate: '{"name":"{{repoName | lower | replace(" ", "-")}}"}',
        extract: [{ field: 'repoName', jsonPath: '$.json.name', pinToVar: 'github.lastRepo' }],
      },
    ],
  });
  console.log('[seed] template: Demo - Echo 2 step');

  // 5. Issue mẫu
  await store.createIssue(ctx, {
    type: 'bug',
    title: 'Demo: nút lưu không phản hồi',
    description: 'Bấm lưu không có gì xảy ra',
    expectedResult: 'Lưu thành công và hiện toast',
    elements: [{ selector: '#save-btn', outerHTML: '<button id="save-btn">Lưu</button>' }],
    status: 'open',
  });
  console.log('[seed] issue: 1');

  console.log('[seed] ✅ Hoàn tất seed dữ liệu mẫu (GIẢ).');
  process.exit(0);
}

main().catch((e) => {
  console.error('[seed] Lỗi:', e);
  process.exit(1);
});
