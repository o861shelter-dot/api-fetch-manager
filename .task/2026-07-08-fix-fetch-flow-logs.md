# [FIX] Fetch Builder / Flow / Engine - log lỗi execute rõ hơn

## 1. Phân loại
- Loại thay đổi: `fix`
- Module: `backend/engine`
- Mức ưu tiên: P1

## 2. Mong muốn hoàn thành (Definition of Done)
- [x] HTTP lỗi trả log rõ response excerpt để biết token sai hay API đích lỗi gì.
- [x] Có env `API_FETCH_MANAGER_REDACT_EXECUTION_VALUES` cho debug giá trị execute thông thường.
- [x] Credential đã lưu vẫn không lộ plaintext trong log/history.

## 3. File/khu vực repo ảnh hưởng
- [x] `backend/src/engine/executor.ts` - log/error execute flow.
- [x] `backend/src/config/env.ts` - env mới.
- [x] `backend/test/executor.test.ts` - hồi quy log lỗi/redact.
- [x] `.env.example`, `docs/OPERATIONS.md`, `docs/SPEC-PLAN/01.SPEC.md` - docs env.
- [x] `.templates/change-request/fix-fetch-builder.md` - cập nhật template ảnh hưởng.

## 4. SPEC liên quan
- [SYS] `docs/SPEC-PLAN/01.SPEC.md` - §4.2, §4.4, §7, §10.1
- [UI]  `docs/SPEC-PLAN/02.SPEC_UI.md` - §10.3

## 5. Test bắt buộc
- [x] `backend/test/executor.test.ts`
- [x] `npm test` xanh · `npm run build` xanh

## 6. Bảo mật
- [x] Không lộ credential/plaintext đã lưu; env debug vẫn redact credential store.

## 7. CẬP NHẬT NGƯỢC khi xong
- [x] Docs/SPEC đã cập nhật: `.env.example`, `docs/OPERATIONS.md`, `docs/SPEC-PLAN/01.SPEC.md`
- [x] `.env.example` / `docs/OPERATIONS.md` nếu đổi env
- [x] Bổ sung file ảnh hưởng MỚI vào template loại này
- [x] Ghi nhật ký vào `docs/SPEC-PLAN/04.PROMPT.md`

## 8. Nhật ký thực hiện
- 2026-07-08 - sửa executor log lỗi HTTP kèm response excerpt; thêm env debug redact; giữ credential store luôn bị che.
