# USER GUIDE — Hướng dẫn sử dụng API Fetch Manager

Dành cho người dùng cuối. Map: [REQ] 2 · [UI] toàn bộ.

## Giao diện tổng quan
- **Thanh trên (Topbar):** logo · **chọn emailOwner** · nút 🎯 (Inspect Mode) · nút ☀/🌙 (đổi theme sáng/tối).
- **Sidebar trái:** điều hướng — Credentials, Fetch Builder, History & Logs, Extracted Data, Variables, Issues.
- Mọi thông báo/xác nhận hiện qua **cửa sổ (modal)** — không có popup trình duyệt. Modal đóng bằng nút ✕ (bấm ra ngoài không đóng).
- Mọi nút có **icon + tooltip** (rê chuột để xem nút làm gì).

## Luồng chính: chọn owner → chọn API → gọi → lưu
1. **Tạo owner:** vào **Credentials** → "Owner mới" → nhập email → Lưu.
2. **Thêm key:** chọn owner ở Topbar → "Thêm key" → nhập `key` (VD `github.token`), giá trị, service → Lưu. Giá trị được **mã hoá**, danh sách chỉ hiện dạng che (`ghp_****ANR1M`). Bấm 👁 (cần xác nhận) để xem giá trị thật.
   - 1 key có thể có **nhiều giá trị** (thêm nhiều lần cùng `key`).
3. **Tạo API (flow):** vào **Fetch Builder** → "Flow mới".
   - Điền tên/service/business.
   - Thêm **step**: chọn method, URL, headers, body. Dùng **placeholder** `{{github.token}}` để chèn credential, `{{input.repoName}}` cho tham số, `{{ctx.auth.accessToken}}` để dùng output step trước.
   - Có thể bấm **"Từ curl"** để dán lệnh `curl` và tự sinh 1 step.
   - Khai **Extract** (JSONPath, VD `$.html_url`) để lưu field từ response; tick "pin → var" để lưu vào kho biến.
   - Khai **Inputs**: `runtime` (hỏi khi chạy), `store` (lấy từ kho biến), `context` (từ step trước).
4. **Gọi API (execute):** ở danh sách flow bấm ▶. Nếu có input runtime, modal sẽ hỏi. Vì gọi API thật (có thể tạo repo/DNS...) hệ thống **hỏi xác nhận**. Khi chạy, xem **tiến trình từng step** (chờ → đang chạy → ✓/✗). Step lỗi bấm ℹ để xem log.
5. **Kết quả** được lưu vào **History** và dữ liệu trích xuất vào **Extracted Data**.

## Fetch Flow nhiều step (nâng cao)
Ví dụ "lấy token rồi tạo repo":
- Step `auth`: POST lấy token, extract `accessToken` = `$.access_token`.
- Step `createRepo`: header `Authorization: Bearer {{ctx.auth.accessToken}}`, body dùng `{{repoName | lower}}`, extract `repoUrl` = `$.html_url` (pin → `github.lastRepoUrl`).

### Biến đổi (transform) trên placeholder
Dùng dấu `|`: `{{repoName | lower | replace(" ", "-")}}`. Whitelist: `upper, lower, trim, replace, slice, base64, base64decode, jsonStringify, urlEncode, date, default`.

### Advanced JS
Trong Builder, mục placeholder có **"Test JS sandbox"**: chạy biểu thức JS (VD chuẩn hoá tên repo). Chạy trong **sandbox** (cấm mạng/ổ đĩa, timeout 200ms) — badge cảnh báo hiển thị rõ.

## Kho biến (Variables)
- **Global** (dùng chung) và **Theo owner** (ưu tiên hơn global).
- Thêm/sửa/xóa qua modal. Bấm 📋 để copy tham chiếu `{{var.key}}` dán vào fetch.

## Dữ liệu trích xuất (Extracted Data)
Xem mọi giá trị đã trích từ các lần fetch (tên repo, git link, id...) kèm **template nguồn + thời điểm**. Bấm 📌 để pin thành biến tái sử dụng.

## History & Logs
- **Lịch sử:** request/response theo owner, lọc theo service/thành công.
- **Logs:** log chi tiết cho debug, lọc theo service/business/level. Token luôn được che.

## Inspect Mode — tạo bug/issue từ giao diện
1. Bấm 🎯 trên Topbar để bật. Con trỏ thành chữ thập.
2. Rê chuột → element được **highlight**; bấm để **chọn** (chọn được **nhiều** element, bấm lại để bỏ).
3. Nút nổi "Tạo issue (n)" → mở form nhập **tiêu đề / mô tả / kết quả mong muốn** (kèm thông tin element).
4. Lưu → issue vào mục **Issues**.

## Issues
Quản lý bug/feature/task: lọc theo loại/status, sửa/xóa. Bấm 📋 để **copy Markdown** (giao cho agent thực hiện) hoặc xem Markdown export.

## Theme
Bấm ☀/🌙 để đổi sáng/tối. Lựa chọn được ghi nhớ.
