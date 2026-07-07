# [FEATURE] Placeholder Engine — `<tên tính năng>`

> Kế thừa `../TEMPLATE_change-request.md`. Chức năng: `{{source | transform}}` + advanced JS sandbox.
> SPEC: [SYS] `docs/SPEC-PLAN/01.SPEC.md` §10.6 · [REQ] `docs/SPEC-PLAN/00.YEUCAU.md` §7.4

## File thường ảnh hưởng
- BE: `src/engine/placeholder.ts` · `src/engine/transforms.ts` · `src/engine/sandbox.ts` · `src/routes/routes.ts` (engine/resolve, engine/transforms, engine/sandbox-test)
- FE: `src/pages/FetchBuilderPage.tsx` (SandboxModal, transform pipe builder)

## Bất biến phải giữ
- Resolve order: credential → var → ctx → input → transforms.
- Advanced JS **chỉ chạy trong sandbox**: cấm network/fs/process/require, timeout 200ms.
- Thêm transform mới phải là hàm thuần, không side-effect.

## Câu hỏi thiết kế
- Transform mới: tên, đối số, ví dụ? → thêm vào `transforms.ts` + test + gợi ý UI.
- Có mở rộng cú pháp placeholder không? → cẩn thận `splitPipes` (dấu | trong ngoặc/nháy).

## Test hồi quy bắt buộc
- [ ] `backend/test/placeholder.test.ts` · `transforms.test.ts` · `sandbox.test.ts` (chặn network/fs + timeout) xanh
