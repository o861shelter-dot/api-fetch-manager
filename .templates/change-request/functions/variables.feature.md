# [FEATURE] Variables + Extracted Data — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: kho biến (global + theo owner), Extracted Data view.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §10.4, §10.5 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` §10.4, §10.5 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §7.2, §7.3

## File thường ảnh hưởng
- BE: `src/modules/stores.ts` (variables/extractions) · `src/routes/routes.ts` (/variables, /extractions) · `src/db/rtdb.ts` (DB variables) · `docker/database.rules.json`
- FE: `src/pages/VariablesPage.tsx` · `src/pages/ExtractionsPage.tsx` · `src/api/api.ts`

## Bất biến phải giữ
- Tham chiếu `{{var.<key>}}`: ưu tiên scope owner → fallback global.
- Extraction có `pinToVar` tự ghi vào rtdb-variables.

## Câu hỏi thiết kế
- Scope biến mới (global/owner)? cần index gì trong `database.rules.json`?
- Extracted Data hiển thị thêm cột nào? nguồn + thời điểm.

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: variables CRUD + resolve; extractions list đúng nguồn
