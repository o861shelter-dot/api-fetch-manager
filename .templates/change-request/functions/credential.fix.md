# [FIX] Credential theo owner — `<mô tả lỗi>`

> Kế thừa `../TEMPLATE_change-request.md`.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §3.1, §4.1, §7.1 · [UI] `docs/SPEC-PLAN/02.SPEC_UI.md`

## Khoanh vùng (điền sẵn)
- FE: `src/pages/CredentialsPage.tsx` · `src/components/Modal.tsx`,`Field.tsx` · `src/api/api.ts`
- BE: `src/routes/routes.ts` (owners/credentials/reveal/import/export) · `src/modules/stores.ts` · `src/lib/crypto.ts`

## Tái hiện & kỳ vọng
- Bước tái hiện: …
- Hành vi đúng kỳ vọng: …

## Chú ý nhạy cảm
- Không được rò plaintext ra API/log; reveal phải qua confirm; masked giữ prefix + đuôi.

## Test hồi quy bắt buộc
- [ ] `backend/test/api.test.ts`: ciphertext at-rest + masked + reveal round-trip vẫn xanh
- [ ] `backend/test/crypto.test.ts` xanh
