# [FEATURE] Fetch Builder / Flow — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: paste curl → sinh step; flow nhiều step tuần tự, chia sẻ context; trích response JSONPath (nested/mảng/wildcard); pin biến.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §5, §10.1, §10.2 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` §10 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §7.1

## File thường ảnh hưởng
- BE: `src/engine/executor.ts` · `src/engine/extract.ts` · `src/modules/parse-curl.ts` · `src/routes/routes.ts` (templates, fetch/execute)
- FE: `src/pages/FetchBuilderPage.tsx` · `src/features/execute/ExecuteModal.tsx` · `src/api/api.ts`

## Bất biến phải giữ
- Flow nhiều step tuần tự, shared context `{{ctx.<stepId>.<field>}}`, `stopOnError`.
- Input source: runtime | store | context.
- Extract JSONPath: nested / mảng / wildcard `[*]`; `pinToVar` ghi vào rtdb-variables.
- Gọi HTTP ngoài qua policy timeout + retry.

## Câu hỏi thiết kế
- Có thêm field vào template/step không? → cập nhật `lib/types.ts` + `api.ts`.
- Có đổi shape execute result không? → cập nhật FE stepper.

## Test hồi quy bắt buộc
- [ ] `backend/test/executor.test.ts` (flow 2 step + stopOnError + redact) · `extract.test.ts` · `parse-curl.test.ts` xanh
