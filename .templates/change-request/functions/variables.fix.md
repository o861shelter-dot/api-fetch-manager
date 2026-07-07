# [FIX] Variables + Extracted Data — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §10.4, §10.5 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` §10.4, §10.5

## Khoanh vùng (điền sẵn)
- BE: `src/modules/stores.ts` · `src/routes/routes.ts` (/variables, /extractions) · `src/db/rtdb.ts`
- FE: `src/pages/VariablesPage.tsx` · `src/pages/ExtractionsPage.tsx` · `src/api/api.ts`

## Chú ý đặc thù
- Resolve `{{var.*}}` ưu tiên owner → global; pinToVar ghi extracted.

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: variables CRUD + resolve xanh
