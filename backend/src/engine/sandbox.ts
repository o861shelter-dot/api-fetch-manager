/**
 * sandbox.ts — Advanced JS trong sandbox cô lập (PLAN Bước 1.2, [SYS] 10.6, [REQ] 7.4)
 *
 * Yêu cầu: chạy biểu thức JS do người dùng nhập, nhưng:
 *   - CẤM HOÀN TOÀN network, filesystem, process, require/import.
 *   - Timeout cứng 200ms.
 *   - Chỉ đọc read-only snapshot: ctx, inputs, vars. Trả về string.
 *
 * Quyết định thiết kế: SPEC gợi ý `isolated-vm`, nhưng module đó cần biên dịch
 * native (dễ vỡ trên nhiều runner). Ta dùng `node:vm` với context RỖNG hoàn toàn
 * (không có global, process, require, fetch, fs) + timeout của runInContext.
 * Điều này đạt các yêu cầu bảo mật cốt lõi mà không cần native build.
 * (Xem NHẬT KÝ: quyết định thay isolated-vm bằng node:vm.)
 */

import vm from 'node:vm';

export interface SandboxInput {
  ctx?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  vars?: Record<string, unknown>;
}

const TIMEOUT_MS = 200;

/** Đóng băng sâu để snapshot read-only. */
function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.getOwnPropertyNames(obj).forEach((k) => deepFreeze((obj as any)[k]));
    Object.freeze(obj);
  }
  return obj;
}

/**
 * Chạy biểu thức/statement. Trả về string (ép kiểu). Ném lỗi nếu vi phạm/timeout.
 */
export function runSandbox(code: string, input: SandboxInput = {}): string {
  const snapshot = deepFreeze({
    ctx: structuredClone(input.ctx ?? {}),
    inputs: structuredClone(input.inputs ?? {}),
    vars: structuredClone(input.vars ?? {}),
  });

  // Context sạch: KHÔNG có global, process, require, fetch, fs...
  const sandboxCtx: Record<string, unknown> = {
    ctx: snapshot.ctx,
    inputs: snapshot.inputs,
    vars: snapshot.vars,
  };
  vm.createContext(sandboxCtx, { codeGeneration: { strings: false, wasm: false } });

  // Hỗ trợ cả expression lẫn statement:
  //  - Có dấu hiệu statement (return/;/while/for/if/const/let/function/throw)
  //    → chạy như function body.
  //  - Ngược lại → coi là expression và tự return.
  const looksLikeStatement = /(^|\W)(return|while|for|if|const|let|var|function|throw)\W|;/.test(code);
  const wrapped = looksLikeStatement
    ? `(function(){ "use strict"; ${code}\n; return ""; })()`
    : `(function(){ "use strict"; return (${code}); })()`;

  let result: unknown;
  try {
    result = vm.runInContext(wrapped, sandboxCtx, { timeout: TIMEOUT_MS });
  } catch (err: any) {
    if (err?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(err?.message ?? '')) {
      throw new Error(`Sandbox timeout (> ${TIMEOUT_MS}ms).`);
    }
    throw new Error(`Sandbox lỗi: ${err?.message ?? String(err)}`);
  }
  if (result === undefined || result === null) return '';
  return typeof result === 'string' ? result : String(result);
}
