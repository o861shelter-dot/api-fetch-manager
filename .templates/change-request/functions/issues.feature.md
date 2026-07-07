# [FEATURE] Issues CRUD — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: Issues CRUD (bug/feature/task).
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.4, §4.5 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §1.6, §1.7

## File thường ảnh hưởng
- BE: `src/routes/routes.ts` (/issues) · `src/modules/stores.ts` · `src/lib/types.ts` · `src/lib/markdown.ts` · `src/db/rtdb.ts` (DB issues)
- FE: `src/pages/IssuesPage.tsx` · `src/api/api.ts`

## Bất biến phải giữ
- Type issue: bug | feature | task; status: open | in_progress | resolved | closed.
- Có export markdown.

## Câu hỏi thiết kế
- Thêm status/field mới? → cập nhật type + FE filter + rules.json index.

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: issue CRUD + markdown export xanh
