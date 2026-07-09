# Supabase — API Reference (nội bộ)

> Chuẩn theo `github.md` (khuôn [UI+] v1.6 §3): mỗi nghiệp vụ có **tác dụng · curl mẫu đầy đủ · response mẫu · field trích xuất · link gốc**.
>
> ⚠️ Mọi curl dùng **placeholder credential** `{{supabase.accessToken}}`, KHÔNG chứa secret thật.

## 1. Tổng quan
- Mục đích trong dự án: quản lý project (Management API), storage (S3-compatible).
- Management API base: `https://api.supabase.com`
- Tài liệu chính thức: https://supabase.com/docs/reference/api

## 2. Xác thực (Authentication)
- Management API: Bearer personal access token. Header `Authorization: Bearer {{supabase.accessToken}}`.
- Credential key (rtdb-keys): `supabase.accessToken`.
- Storage S3: AccessKeyID/SecretAccessKey (key `supabase.database`) — dùng qua SDK/S3 client (không nằm trong Management API).
- Cách lấy: Supabase → Account → Access Tokens → https://supabase.com/dashboard/account/tokens ; Storage → Project Settings → S3 credentials.

---

## 3. Nghiệp vụ: Projects

### 3.1 List projects — `GET /v1/projects`
**Tác dụng:** liệt kê project (dùng cho Services & Resources tab Supabase → resource `project`).
**Doc:** https://supabase.com/docs/reference/api/v1-list-all-projects
```bash
curl https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer {{supabase.accessToken}}"
```
**Response mẫu (200):**
```json
[
  { "id": "abcdefghijklmnop", "name": "demo", "region": "ap-southeast-1", "status": "ACTIVE_HEALTHY", "created_at": "2026-06-01T00:00:00Z" }
]
```
**Trích xuất (list snapshot):** `items=$` · `projectRef=$[0].id` (pin `supabase.lastProjectRef`) · `projectNames=$[*].name`

### 3.2 Lấy 1 project — `GET /v1/projects/{ref}`
**Tác dụng:** xem chi tiết 1 project.
**Doc:** https://supabase.com/docs/reference/api
```bash
curl https://api.supabase.com/v1/projects/{{projectRef}} \
  -H "Authorization: Bearer {{supabase.accessToken}}"
```
**Response mẫu (200):**
```json
{ "id": "abcdefghijklmnop", "name": "demo", "region": "ap-southeast-1", "status": "ACTIVE_HEALTHY" }
```
**Trích xuất:** `projectStatus=$.status`

### 3.3 Tạo project — `POST /v1/projects`
**Tác dụng:** tạo project mới (action ghi → cần confirm ở UI).
**Doc:** https://supabase.com/docs/reference/api/v1-create-a-project
```bash
curl -X POST https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer {{supabase.accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{"name":"{{projectName}}","organization_id":"{{orgId}}","region":"{{region | default(ap-southeast-1)}}","db_pass":"{{dbPass}}"}'
```
**Response mẫu (201):**
```json
{ "id": "newprojref123456", "name": "demo2", "region": "ap-southeast-1", "status": "COMING_UP" }
```
**Trích xuất:** `projectRef=$.id` (pin `supabase.lastProjectRef`)

---

## 4. Nghiệp vụ: API keys của project

### 4.1 Lấy API keys — `GET /v1/projects/{ref}/api-keys`
**Tác dụng:** lấy anon/service_role key của project.
**Doc:** https://supabase.com/docs/reference/api
```bash
curl https://api.supabase.com/v1/projects/{{projectRef}}/api-keys \
  -H "Authorization: Bearer {{supabase.accessToken}}"
```
**Response mẫu (200):**
```json
[
  { "name": "anon", "api_key": "sbp_anon_xxxxxxxx" },
  { "name": "service_role", "api_key": "sbp_service_xxxxxxxx" }
]
```
**Trích xuất:** `anonKey=$[?(@.name=='anon')].api_key` · `serviceKey=$[?(@.name=='service_role')].api_key`

---

## 5. Bảng field trích xuất gợi ý (tổng hợp)
| field | jsonPath | pinToVar |
|---|---|---|
| items (projects) | `$` | — (Services Refresh) |
| projectRef | `$[0].id` | `supabase.lastProjectRef` |
| projectStatus | `$.status` | — |

## 6. Rate limit & lỗi thường gặp
- `401` = access token sai/hết hạn. `403` = thiếu quyền trên org/project. `404` = sai project ref.

## 7. Bảo mật & lưu ý
- Access token + service_role key + S3 secret rất nhạy cảm. Token luôn masked ở UI, resolve theo `credId`.
- ⚠️ Token/secret trong doc gốc đã lộ → PHẢI rotate toàn bộ; seed/test chỉ dùng key GIẢ.

## 8. Cập nhật
- 2026-07-09 — mở rộng đầy đủ curl + response mẫu + extract theo khuôn `github.md` (B6).
