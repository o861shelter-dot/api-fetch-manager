# [FIX] Fetch Builder / Flow — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §5, §10.1, §10.2 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` §10

## Khoanh vùng (điền sẵn)
- FE: `src/pages/FetchBuilderPage.tsx` · `src/features/execute/ExecuteModal.tsx`
- BE: `src/engine/executor.ts` · `src/engine/extract.ts` · `src/modules/parse-curl.ts` · `src/routes/routes.ts` (templates, fetch/execute)

## Chú ý đặc thù
- Flow nhiều step + shared context; input source runtime/store/context.
- Extract JSONPath nested/mảng/wildcard + pinToVar.
- HTTP policy: timeout/retry/size-limit; stopOnError.

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Test hồi quy bắt buộc
- [ ] `executor.test.ts` · `extract.test.ts` · `parse-curl.test.ts` xanh
