# [FIX] Issues CRUD — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.4, §4.5

## Khoanh vùng (điền sẵn)
- BE: `src/routes/routes.ts` (/issues) · `src/modules/stores.ts` · `src/lib/types.ts` · `src/lib/markdown.ts`
- FE: `src/pages/IssuesPage.tsx` · `src/api/api.ts`

## Chú ý đặc thù
- Type bug/feature/task; status hợp lệ; markdown export đúng format.

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: issue CRUD + markdown xanh
