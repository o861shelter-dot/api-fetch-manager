# TEST CASES — API Fetch Manager

Map mọi acceptance criteria [SYS] 9 & 10.7 + checklist [UI] 9 & 10.7. Unit/integration test tự động ở `backend/test/*` (chạy `npm test`). Bảng dưới là test case nghiệm thu.

## A. Backend — tự động (vitest)
Chạy từ repo root: `npm test` → **63 tests / 11 files PASS**.

| ID | Mô tả | Bước | Kỳ vọng | Map | Trạng thái |
|---|---|---|---|---|---|
| BE-01 | Encrypt→decrypt round-trip | crypto.test | Giải mã đúng plaintext | [SYS]7.1 | ✅ |
| BE-02 | Mỗi lần encrypt IV khác | crypto.test | IV & ciphertext khác nhau | [SYS]7.1 | ✅ |
| BE-03 | maskSecret giữ prefix+đuôi | crypto.test | `ghp_****ANR1M` | [SYS]7.1 | ✅ |
| BE-04 | Transform whitelist đủ 11 | transforms.test | Có upper..default | [SYS]10.6 | ✅ |
| BE-05 | Pipe `replace(" ","-")` | transforms.test | Đúng đối số có space | [SYS]10.6 | ✅ |
| BE-06 | Sandbox chặn process/require/network | sandbox.test | Ném lỗi | [SYS]10.6 | ✅ |
| BE-07 | Sandbox timeout vòng lặp vô hạn | sandbox.test | Ném lỗi timeout | [SYS]10.6 | ✅ |
| BE-08 | JSONPath nested/index/wildcard | extract.test | Trả đúng giá trị/mảng | [SYS]10.2 | ✅ |
| BE-09 | Placeholder credential/var/ctx/input + order | placeholder.test | Resolve đúng thứ tự | [SYS]10.6 | ✅ |
| BE-10 | parse-curl method/url/header/body + auth detect | parse-curl.test | Sinh step + credentialRef | [SYS]5 | ✅ |
| BE-11 | **Flow 2 step**: step2 dùng `{{ctx.auth.accessToken}}` + pinToVar | executor.test | End-to-end pass, var được pin | [SYS]10.1,10.2 | ✅ |
| BE-12 | stopOnError → dừng + log không lộ token | executor.test | Dừng, log che token | [SYS]4.2,7.1 | ✅ |
| BE-13 | API: credential lưu ciphertext, list masked | api.test | Không lộ plaintext | [SYS]3.1,7.1 | ✅ |
| BE-14 | 1 key nhiều giá trị | api.test | 3 credential cùng key | [REQ]2.1 | ✅ |
| BE-15 | Issue → markdown export | api.test | Chứa `[BUG]`, selector | [SYS]4.5,6 | ✅ |
| BE-16 | Variables CRUD + resolve | api.test | Lưu & đọc đúng | [SYS]10.4 | ✅ |

## B. Full-stack — smoke (thủ công/curl)
| ID | Mô tả | Bước | Kỳ vọng | Trạng thái |
|---|---|---|---|---|
| FS-01 | Health | `GET /api/health` | `{ok:true,...storage}` | ✅ |
| FS-02 | Ciphertext at-rest | seed file → đọc `rtdb-keys.json` | Không có plaintext, có `valueEnc`+`iv` | ✅ |
| FS-03 | SPA phục vụ | `GET /` | `<title>API Fetch Manager</title>` | ✅ |
| FS-04 | SPA fallback route sâu | `GET /anything` | Trả index (200) | ✅ |
| FS-05 | Seed dữ liệu mẫu | `npm run seed` | 1 owner, 3 cred, 1 template, 1 issue | ✅ |

## C. UI — checklist ([UI] 9 & 10.7)
| ID | Mô tả | Kỳ vọng | Trạng thái |
|---|---|---|---|
| UI-01 | Responsive mobile/tablet/desktop cùng hệ component | Sidebar→drawer, table→card <768px | ✅ |
| UI-02 | 2 theme sáng/tối qua CSS variable | Toggle đổi `data-theme`, không hardcode | ✅ |
| UI-03 | Font 300–400, base 13px, spacing 4px | Token áp dụng | ✅ |
| UI-04 | **0 alert/confirm/prompt** trình duyệt | grep xác nhận 0 kết quả | ✅ |
| UI-05 | Modal có nút ✕, **click ngoài KHÔNG đóng**, ESC đóng, tự scroll | Modal.tsx | ✅ |
| UI-06 | Mọi button có icon + tooltip | Button bắt buộc `tooltip` prop | ✅ |
| UI-07 | Chức năng quan trọng có confirm | Xóa/execute/import/reveal đều confirm | ✅ |
| UI-08 | Credential masked, reveal qua confirm | CredentialsPage | ✅ |
| UI-09 | Inspect: highlight, chọn nhiều element, tạo issue, Markdown | InspectMode + IssuesPage | ✅ |
| UI-10 | Scrollbar mảnh đồng bộ theme; icon set nhất quán (Lucide) | tokens.css + Icon.tsx | ✅ |
| UI-11 | Fetch Flow builder: thêm/xóa/sắp xếp step, step editor đủ | FetchBuilderPage | ✅ |
| UI-12 | Placeholder highlight + gợi ý; JS editor test qua modal (không alert) | StepEditor + SandboxModal | ✅ |
| UI-13 | Execute modal hỏi input runtime; stepper progress; xem log lỗi | ExecuteModal | ✅ |
| UI-14 | Extracted Data: filter, bảng field/value/nguồn/thời điểm, pin (confirm) | ExtractionsPage | ✅ |
| UI-15 | Variables: tab global/owner, CRUD modal, copy `{{var.*}}` | VariablesPage | ✅ |

## Cách chạy lại
```bash
npm install
npm test                     # backend unit + integration (Phase 4.1)
npm run build                # build FE+BE (kiểm tra tsc)
grep -rn "alert(" frontend/src   # UI-04: phải rỗng (trừ Icon.alert)
```
