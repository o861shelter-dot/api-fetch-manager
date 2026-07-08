# [FEATURE] Fetch Builder - Test API theo step + copy curl

## 1. Phân loại
- Loại thay đổi: `feature-new`
- Module: `backend/routes`, `frontend/pages`
- Mức ưu tiên: P1

## 2. Mong muốn hoàn thành (Definition of Done)
- [x] Builder có Button Test API theo step đang chọn.
- [x] Có input params runtime JSON dùng cho test.
- [x] Có panel show toàn bộ response; JSON format đẹp.
- [x] Có nút Copy curl theo method/url/header/body của step và params hiện tại.
- [x] Credential đã lưu vẫn không lộ plaintext trong response/log/curl export.

## 3. File/khu vực repo ảnh hưởng
- [x] `backend/src/routes/routes.ts` - endpoint `/api/fetch/test-step`.
- [x] `backend/src/engine/executor.ts` - trả response khi test.
- [x] `backend/test/api.test.ts` - hồi quy endpoint test-step.
- [x] `frontend/src/api/api.ts` - type response test-step.
- [x] `frontend/src/pages/FetchBuilderPage.tsx` - UI Test API + Copy curl.
- [x] `frontend/src/styles/components.css` - response panel.
- [x] `docs/SPEC-PLAN/01.SPEC.md`, `docs/SPEC-PLAN/02.SPEC_UI.md` - cập nhật spec.

## 4. SPEC liên quan
- [SYS] `docs/SPEC-PLAN/01.SPEC.md` - §4.2, §5, §10.1, §10.2
- [UI]  `docs/SPEC-PLAN/02.SPEC_UI.md` - §10.1

## 5. Test bắt buộc
- [x] `backend/test/api.test.ts`
- [x] `npm test` xanh · `npm run build` xanh

## 6. Bảo mật
- [x] Không lộ credential/plaintext đã lưu; curl export giữ placeholder credential.

## 7. CẬP NHẬT NGƯỢC khi xong
- [x] Docs/SPEC đã cập nhật.
- [x] Ghi nhật ký vào `docs/SPEC-PLAN/04.PROMPT.md`

## 8. Nhật ký thực hiện
- 2026-07-08 - thêm test-step endpoint và UI Test API/Copy curl theo step đang active.
