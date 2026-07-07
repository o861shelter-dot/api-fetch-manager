# [FEATURE] Inspect Mode — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: chọn nhiều element trên UI → tạo issue → export/copy Markdown.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.4, §6, §4.5 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` §6 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §1.6

## File thường ảnh hưởng
- FE: `src/features/inspect/InspectMode.tsx` · `src/pages/IssuesPage.tsx` · `src/api/api.ts`
- BE: `src/routes/routes.ts` (/issues, /issues/:id/markdown) · `src/lib/markdown.ts` · `src/modules/stores.ts`

## Bất biến phải giữ
- Chọn **nhiều element**; lưu `selector` + `outerHTML` + `boundingRect`.
- Loại trừ UI app khi inspect (`.overlay/.inspect-fab/.topbar`).
- Export/copy Markdown theo format chuẩn.

## Câu hỏi thiết kế
- Thêm metadata element nào? → cập nhật type issue + markdown.

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: issue → markdown chứa `[BUG]` + selector
