# [FIX] Inspect Mode — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.4, §6, §4.5 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` §6

## Khoanh vùng (điền sẵn)
- FE: `src/features/inspect/InspectMode.tsx` · `src/pages/IssuesPage.tsx`
- BE: `src/routes/routes.ts` (/issues, markdown) · `src/lib/markdown.ts`

## Chú ý đặc thù
- Highlight hover; chọn/bỏ chọn nhiều element; không bắt UI của app.
- Markdown export giữ selector + outerHTML.

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts` (issue markdown) xanh
