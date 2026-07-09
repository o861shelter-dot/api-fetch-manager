# Tailscale — API Reference (nội bộ)

> Chuẩn theo `github.md` (khuôn [UI+] v1.6 §3): mỗi nghiệp vụ có **tác dụng · curl mẫu đầy đủ · response mẫu · field trích xuất · link gốc**.
>
> ⚠️ Mọi curl dùng **placeholder credential** `{{tailscale.token}}` / `{{tailscale.tailnet}}`, KHÔNG chứa secret thật.

## 1. Tổng quan
- Mục đích trong dự án: quản lý tailnet, devices, auth keys.
- Base URL: `https://api.tailscale.com/api/v2`
- Tài liệu chính thức: https://tailscale.com/api

## 2. Xác thực (Authentication)
- Kiểu: API access token (Bearer) hoặc OAuth client (clientId/secret → token).
- Header mẫu: `Authorization: Bearer {{tailscale.token}}`
- Credential key (rtdb-keys): `tailscale.token` (access token); tailnet lưu ở biến `tailscale.tailnet` (VD `example.com` hoặc `-` cho default).
- Cách lấy: Admin console → Settings → Keys / OAuth clients → https://login.tailscale.com/admin/settings/keys
- Scope tối thiểu: `devices:read` (đọc), `devices:write` (xóa/đổi tag).

---

## 3. Nghiệp vụ: Devices

### 3.1 List devices — `GET /tailnet/{tailnet}/devices`
**Tác dụng:** liệt kê thiết bị trong tailnet (dùng cho Services & Resources tab Tailscale → resource `device`).
**Doc:** https://tailscale.com/api#tag/devices/GET/tailnet/{tailnet}/devices
```bash
curl "https://api.tailscale.com/api/v2/tailnet/{{tailscale.tailnet}}/devices" \
  -H "Authorization: Bearer {{tailscale.token}}"
```
**Response mẫu (200):**
```json
{
  "devices": [
    { "id": "n1234567890", "hostname": "laptop-demo", "name": "laptop-demo.example.ts.net", "addresses": ["100.64.0.1"], "os": "linux", "authorized": true }
  ]
}
```
**Trích xuất (list snapshot):** `items=$.devices` · `deviceId=$.devices[0].id` (pin `tailscale.lastDeviceId`) · `deviceIds=$.devices[*].id`

### 3.2 Lấy 1 device — `GET /device/{deviceId}`
**Tác dụng:** xem chi tiết 1 device.
**Doc:** https://tailscale.com/api#tag/devices/GET/device/{deviceId}
```bash
curl "https://api.tailscale.com/api/v2/device/{{deviceId}}" \
  -H "Authorization: Bearer {{tailscale.token}}"
```
**Response mẫu (200):**
```json
{ "id": "n1234567890", "hostname": "laptop-demo", "authorized": true, "lastSeen": "2026-07-09T06:00:00Z", "tags": ["tag:server"] }
```
**Trích xuất:** `lastSeen=$.lastSeen` · `authorized=$.authorized`

### 3.3 Xóa device — `DELETE /device/{deviceId}`
**Tác dụng:** gỡ thiết bị khỏi tailnet (action ghi → cần confirm ở UI).
**Doc:** https://tailscale.com/api#tag/devices/DELETE/device/{deviceId}
```bash
curl -X DELETE "https://api.tailscale.com/api/v2/device/{{deviceId}}" \
  -H "Authorization: Bearer {{tailscale.token}}"
```
**Response:** `200 OK` (không body đáng kể).

---

## 4. Nghiệp vụ: Auth keys

### 4.1 List keys — `GET /tailnet/{tailnet}/keys`
**Tác dụng:** liệt kê auth key.
**Doc:** https://tailscale.com/api#tag/keys/GET/tailnet/{tailnet}/keys
```bash
curl "https://api.tailscale.com/api/v2/tailnet/{{tailscale.tailnet}}/keys" \
  -H "Authorization: Bearer {{tailscale.token}}"
```
**Response mẫu (200):**
```json
{ "keys": [ { "id": "k1234", "created": "2026-07-01T00:00:00Z", "expires": "2026-10-01T00:00:00Z" } ] }
```
**Trích xuất:** `keyId=$.keys[0].id`

### 4.2 Tạo auth key — `POST /tailnet/{tailnet}/keys`
**Tác dụng:** tạo auth key mới (reusable/ephemeral).
**Doc:** https://tailscale.com/api#tag/keys/POST/tailnet/{tailnet}/keys
```bash
curl -X POST "https://api.tailscale.com/api/v2/tailnet/{{tailscale.tailnet}}/keys" \
  -H "Authorization: Bearer {{tailscale.token}}" \
  -H "Content-Type: application/json" \
  -d '{"capabilities":{"devices":{"create":{"reusable":true,"ephemeral":false,"tags":["tag:server"]}}}}'
```
**Response mẫu (200):**
```json
{ "id": "k5678", "key": "tskey-auth-xxxxxxxx", "expires": "2026-10-01T00:00:00Z" }
```
**Trích xuất:** `authKey=$.key` (pin `tailscale.lastAuthKey`)

---

## 5. Bảng field trích xuất gợi ý (tổng hợp)
| field | jsonPath | pinToVar |
|---|---|---|
| items (devices) | `$.devices` | — (Services Refresh) |
| deviceId | `$.devices[0].id` | `tailscale.lastDeviceId` |
| authKey | `$.key` | `tailscale.lastAuthKey` |

## 6. Rate limit & lỗi thường gặp
- `401` = token sai/hết hạn. `403` = thiếu scope. `404` = sai tailnet/deviceId.

## 7. Bảo mật & lưu ý
- Access token / OAuth client secret rất nhạy cảm. Token luôn masked ở UI, resolve theo `credId`.
- ⚠️ Secret trong doc gốc đã lộ → PHẢI rotate ngay; seed/test chỉ dùng token GIẢ.

## 8. Cập nhật
- 2026-07-09 — mở rộng đầy đủ curl + response mẫu + extract theo khuôn `github.md` (B6).
