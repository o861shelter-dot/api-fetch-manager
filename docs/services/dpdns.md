# DigitalPlat FreeDomain (dpdns.org) — API Reference (nội bộ)

> Chuẩn theo `github.md` (khuôn [UI+] v1.6 §3). Khác các dịch vụ còn lại: **dpdns.org KHÔNG cung cấp REST API công khai quản lý DNS record**. Tài liệu này ghi đúng cách hoạt động thực tế để tránh cấu hình sai.
>
> ⚠️ Mọi ví dụ dùng **placeholder** `{{...}}`, KHÔNG chứa secret thật.

## 1. Tổng quan
- `*.dpdns.org` là một trong các namespace miễn phí của **DigitalPlat FreeDomain** (nonprofit, AGPL-3.0), cùng `*.us.kg`, `*.qzz.io`, `*.xx.kg`.
- Cổng quản lý: https://domain.digitalplat.org (đăng ký domain + đặt **nameserver**).
- Mô hình: đăng ký domain miễn phí → **ủy quyền DNS (NS) sang một provider khác** (Cloudflare, Hostry, FreeDNS…). Việc tạo/sửa/xóa DNS record thực hiện **tại provider được ủy quyền**, không phải tại dpdns.org.
- Nguồn: https://domain.digitalplat.org · repo: https://github.com/DigitalPlat/FreeDomain

## 2. Xác thực (Authentication)
- Cổng domain.digitalplat.org dùng đăng nhập tài khoản (web), **không có public API token** tài liệu hoá cho thao tác DNS.
- Credential key (rtdb-keys): `dpdns.token` — chỉ dùng nếu về sau DigitalPlat mở API; hiện để trống/không bắt buộc.
- Thực tế cần credential của **provider DNS được ủy quyền**. Nếu ủy quyền cho Cloudflare → dùng `cloudflare.token` và các nghiệp vụ trong `cloudflare.md` (§4 DNS records).

## 3. Nghiệp vụ DNS (thực hiện qua provider được ủy quyền)

### 3.1 Đặt nameserver cho domain dpdns.org
**Tác dụng:** trỏ domain `*.dpdns.org` sang provider DNS.
**Cách làm:** đăng nhập https://domain.digitalplat.org → chọn domain → mục **Nameservers** → nhập NS của provider (VD Cloudflare: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`) → Lưu.
> Đây là thao tác trên web UI; không có endpoint REST tài liệu hoá để tự động hoá tại dpdns.org.

### 3.2 Tạo/sửa/xóa DNS record — thực hiện tại provider
**Tác dụng:** quản lý A/AAAA/CNAME/TXT của `*.dpdns.org`.
**Cách làm:** dùng API của provider được ủy quyền. Ví dụ Cloudflare (đầy đủ curl + response ở `cloudflare.md`):
```bash
# Tạo A record cho sub.example.dpdns.org qua Cloudflare
curl -X POST https://api.cloudflare.com/client/v4/zones/{{zoneId}}/dns_records \
  -H "Authorization: Bearer {{cloudflare.token}}" \
  -H "Content-Type: application/json" \
  -d '{"type":"A","name":"sub.example.dpdns.org","content":"{{recordIp}}","ttl":3600}'
```
**Response mẫu (200):**
```json
{ "success": true, "result": { "id": "rec777", "name": "sub.example.dpdns.org", "type": "A", "content": "1.2.3.4" } }
```
**Trích xuất:** `recordId=$.result.id` (pin `dpdns.lastRecordId`)

## 4. Kiểm tra phân giải (không cần credential)
**Tác dụng:** xác minh record đã hoạt động qua DNS-over-HTTPS công khai.
```bash
curl "https://dns.google/resolve?name=sub.example.dpdns.org&type=A" \
  -H "Accept: application/dns-json"
```
**Response mẫu (200):**
```json
{ "Status": 0, "Answer": [ { "name": "sub.example.dpdns.org.", "type": 1, "data": "1.2.3.4" } ] }
```
**Trích xuất:** `resolvedIp=$.Answer[0].data`

## 5. Bảng field trích xuất gợi ý (tổng hợp)
| field | jsonPath | pinToVar |
|---|---|---|
| recordId (qua provider) | `$.result.id` | `dpdns.lastRecordId` |
| resolvedIp (DoH) | `$.Answer[0].data` | — |

## 6. Rate limit & lỗi thường gặp
- Không có API riêng nên giới hạn phụ thuộc provider DNS được ủy quyền (xem `cloudflare.md` §6).
- Domain chưa verify NS → record không phân giải; kiểm tra lại bước §3.1.

## 7. Bảo mật & lưu ý
- Không lưu secret dpdns.org (không có API token). Credential thực dùng là của provider (Cloudflare…), luôn masked ở UI, resolve theo `credId`.
- ⚠️ Nếu doc gốc có lộ token nào → rotate; seed/test chỉ dùng dữ liệu GIẢ.

## 8. Cập nhật
- 2026-07-09 — viết lại theo hiện trạng: dpdns.org là DigitalPlat FreeDomain, ủy quyền NS sang provider; không có REST API DNS công khai (đã xác minh qua trang chính thức). Thay các mục "CẦN XÁC MINH" trước đây (B6).
