# [FEATURE] History & Logs — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: History & Logs (che token) để debug.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.2, §3.3, §4.4 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §1.3, §1.4

## File thường ảnh hưởng
- BE: `src/routes/routes.ts` (/history, /logs) · `src/modules/stores.ts` · `src/engine/executor.ts` (redact + ghi history/log) · `src/db/rtdb.ts` (DB history, logs)
- FE: `src/pages/HistoryPage.tsx` · `src/api/api.ts`

## Bất biến phải giữ
- Log **không chứa plaintext token** (dùng `redact()`).
- Filter theo service/business/level/success.

## Câu hỏi thiết kế
- Thêm field log/history nào? cần index gì?
- Có ảnh hưởng redact không? (đừng làm lộ secret)

## Test hồi quy bắt buộc
- [ ] `backend/test/executor.test.ts`: log/history che token vẫn xanh
