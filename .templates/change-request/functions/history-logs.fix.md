# [FIX] History & Logs — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.2, §3.3, §4.4

## Khoanh vùng (điền sẵn)
- BE: `src/routes/routes.ts` (/history, /logs) · `src/modules/stores.ts` · `src/engine/executor.ts` (redact)
- FE: `src/pages/HistoryPage.tsx`

## Chú ý đặc thù
- Tuyệt đối không rò token trong log (redact Bearer/ghp_/sbp_...).
- Filter service/business/level/success đúng.

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Test hồi quy bắt buộc
- [ ] `backend/test/executor.test.ts` (redact) xanh
