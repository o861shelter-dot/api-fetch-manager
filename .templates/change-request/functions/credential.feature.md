# [FEATURE] Credential theo owner — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: quản lý credential theo owner (CRUD, 1 key nhiều giá trị, import/export). Giá trị luôn mã hoá, API trả masked.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.1, §4.1, §7.1 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md` · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §2.1

## File thường ảnh hưởng
- BE: `src/routes/routes.ts` (owners/credentials/reveal/import/export) · `src/modules/stores.ts` · `src/lib/crypto.ts` · `src/lib/types.ts`
- FE: `src/pages/CredentialsPage.tsx` · `src/api/api.ts` · `src/components/Modal.tsx`,`Field.tsx`
- storage: `src/db/rtdb.ts` (DB keys) · `docker/database.rules.json`

## Bất biến phải giữ
- Credential mã hoá at-rest (AES-256-GCM); API trả **masked**, plaintext chỉ qua `/reveal` (có audit log).
- 1 key được phép nhiều giá trị (nhiều credId cùng field key).

## Câu hỏi thiết kế
- Field mới có nhạy cảm không? có cần mã hoá / mask không?
- Import/export round-trip có giữ nguyên dữ liệu?

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: ciphertext at-rest + masked + reveal round-trip + 1 key nhiều giá trị
- [ ] `backend/test/crypto.test.ts` xanh
