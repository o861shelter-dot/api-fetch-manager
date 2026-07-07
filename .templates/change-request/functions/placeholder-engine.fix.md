# [FIX] Placeholder Engine — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §10.6 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §7.4

## Khoanh vùng (điền sẵn)
- BE: `src/engine/placeholder.ts` · `src/engine/transforms.ts` · `src/engine/sandbox.ts` · `src/routes/routes.ts` (engine/*)

## Chú ý đặc thù
- Resolve order credential→var→ctx→input→transform; `splitPipes` không tách `|` trong ngoặc/nháy.
- Sandbox: cấm network/fs/process/require, timeout 200ms, snapshot read-only.

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Test hồi quy bắt buộc
- [ ] `placeholder.test.ts` · `transforms.test.ts` · `sandbox.test.ts` xanh
