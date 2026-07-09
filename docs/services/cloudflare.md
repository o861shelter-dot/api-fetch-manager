# Cloudflare — API Reference (nội bộ)

> Chuẩn theo `github.md` (khuôn [UI+] v1.6 §3): mỗi nghiệp vụ có **tác dụng · curl mẫu đầy đủ · response mẫu · field trích xuất · link gốc**.
>
> ⚠️ Mọi curl dùng **placeholder credential** `{{cloudflare.token}}`, KHÔNG chứa secret thật. Resolve theo `credId` khi key có nhiều giá trị.

## 1. Tổng quan
- Mục đích trong dự án: quản lý DNS/nameserver, zones, DNS records.
- Base URL: `https://api.cloudflare.com/client/v4`
- Tài liệu chính thức: https://developers.cloudflare.com/api
- Định dạng response chung: `{ "success": bool, "errors": [], "messages": [], "result": ... }`

## 2. Xác thực (Authentication)
- Kiểu: Bearer token (scoped token — khuyến nghị) hoặc Global API Key.
- Header mẫu: `Authorization: Bearer {{cloudflare.token}}` + `Content-Type: application/json`
- Credential key (rtdb-keys): `cloudflare.token`.
- Cách lấy: Cloudflare dashboard → My Profile → API Tokens → Create Token → https://dash.cloudflare.com/profile/api-tokens
- Scope tối thiểu: `Zone.DNS:Edit`, `Zone.Zone:Read`.

---

## 3. Nghiệp vụ: Accounts & Zones

### 3.1 Lấy account id — `GET /accounts`
**Tác dụng:** lấy account id (dùng làm biến cho các flow sau).
**Doc:** https://developers.cloudflare.com/api/operations/accounts-list-accounts
```bash
curl https://api.cloudflare.com/client/v4/accounts \
  -H "Authorization: Bearer {{cloudflare.token}}" \
  -H "Content-Type: application/json"
```
**Response mẫu (200):**
```json
{
  "success": true,
  "result": [
    { "id": "a1b2c3d4e5f6", "name": "Demo Account", "type": "standard" }
  ]
}
```
**Trích xuất:** `accountId=$.result[0].id` (pin `cloudflare.accountId`)

### 3.2 List zones — `GET /zones`
**Tác dụng:** liệt kê zone (dùng cho Services & Resources tab Cloudflare → resource `zone`).
**Doc:** https://developers.cloudflare.com/api/operations/zones-get
```bash
curl "https://api.cloudflare.com/client/v4/zones?per_page=50" \
  -H "Authorization: Bearer {{cloudflare.token}}" \
  -H "Content-Type: application/json"
```
**Response mẫu (200):**
```json
{
  "success": true,
  "result": [
    { "id": "zone1234567890", "name": "example.com", "status": "active" }
  ]
}
```
**Trích xuất (list snapshot):** `items=$.result` · `zoneId=$.result[0].id` (pin `cloudflare.lastZoneId`) · `zoneName=$.result[0].name`

---

## 4. Nghiệp vụ: DNS records

### 4.1 List DNS records — `GET /zones/{zone_id}/dns_records`
**Tác dụng:** liệt kê record của 1 zone.
**Doc:** https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
```bash
curl "https://api.cloudflare.com/client/v4/zones/{{zoneId}}/dns_records?per_page=100" \
  -H "Authorization: Bearer {{cloudflare.token}}"
```
**Response mẫu (200):**
```json
{
  "success": true,
  "result": [
    { "id": "rec001", "type": "A", "name": "app.example.com", "content": "1.2.3.4", "proxied": true }
  ]
}
```
**Trích xuất:** `recordId=$.result[0].id` · `recordContent=$.result[0].content`

### 4.2 Tạo DNS record — `POST /zones/{zone_id}/dns_records`
**Tác dụng:** tạo record mới.
**Doc:** https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
```bash
curl -X POST https://api.cloudflare.com/client/v4/zones/{{zoneId}}/dns_records \
  -H "Authorization: Bearer {{cloudflare.token}}" \
  -H "Content-Type: application/json" \
  -d '{"type":"A","name":"{{recordName}}","content":"{{recordIp}}","ttl":3600,"proxied":true}'
```
**Response mẫu (200):**
```json
{ "success": true, "result": { "id": "rec777", "type": "A", "name": "x.example.com", "content": "1.2.3.4" } }
```
**Trích xuất:** `recordId=$.result.id` (pin `cloudflare.lastRecordId`)

### 4.3 Cập nhật DNS record — `PUT /zones/{zone_id}/dns_records/{id}`
**Tác dụng:** cập nhật nội dung record.
**Doc:** https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-update-dns-record
```bash
curl -X PUT https://api.cloudflare.com/client/v4/zones/{{zoneId}}/dns_records/{{recordId}} \
  -H "Authorization: Bearer {{cloudflare.token}}" \
  -H "Content-Type: application/json" \
  -d '{"type":"A","name":"{{recordName}}","content":"{{recordIp}}","ttl":3600}'
```
**Response mẫu (200):** như 4.2.

### 4.4 Xóa DNS record — `DELETE /zones/{zone_id}/dns_records/{id}`
**Tác dụng:** xóa record (action ghi → cần confirm ở UI).
**Doc:** https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-delete-dns-record
```bash
curl -X DELETE https://api.cloudflare.com/client/v4/zones/{{zoneId}}/dns_records/{{recordId}} \
  -H "Authorization: Bearer {{cloudflare.token}}"
```
**Response mẫu (200):**
```json
{ "success": true, "result": { "id": "rec777" } }
```

---

## 5. Bảng field trích xuất gợi ý (tổng hợp)
| field | jsonPath | pinToVar |
|---|---|---|
| accountId | `$.result[0].id` | `cloudflare.accountId` |
| zoneId | `$.result[0].id` | `cloudflare.lastZoneId` |
| recordId | `$.result.id` | `cloudflare.lastRecordId` |
| items (zones) | `$.result` | — (Services Refresh) |

## 6. Rate limit & lỗi thường gặp
- Response luôn có `success`. Khi lỗi: `{ "success": false, "errors": [{ "code": 1003, "message": "Invalid..." }] }` → đọc `errors[].message`.
- `403` = token thiếu scope. `429` = quá rate limit (mặc định 1200 req/5 phút).

## 7. Bảo mật & lưu ý
- Global API Key quyền rất rộng → ưu tiên scoped token. Token luôn masked ở UI, resolve theo `credId`.
- ⚠️ Token trong doc gốc đã lộ → PHẢI rotate; seed/test chỉ dùng token GIẢ.

## 8. Cập nhật
- 2026-07-09 — mở rộng đầy đủ curl + response mẫu + extract theo khuôn `github.md` (B6).
