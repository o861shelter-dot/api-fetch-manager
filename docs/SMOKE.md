# SMOKE — Dữ liệu mẫu & smoke test

Map: PLAN Bước 4.3. Dữ liệu seed là **GIẢ** (không dùng secret thật đã lộ).

## 1. Seed
```bash
cd backend
export API_FETCH_MANAGER_STORAGE_MODE=file
export API_FETCH_MANAGER_DATA_DIR=.data
export API_FETCH_MANAGER_ENCRYPTION_KEY="$(openssl rand -base64 32)"
npm run seed
```
Tạo:
- 1 owner: `demo.owner@example.com`
- 3 credential (2 giá trị cho `github.token`, 1 `cloudflare.token`) — giá trị GIẢ
- 2 biến (`api.base` global, `github.org` owner)
- 1 template flow 2 step (dùng httpbin.org để chạy thật được)
- 1 issue mẫu

## 2. Smoke test luồng chính
```bash
# chạy server (cùng ENCRYPTION_KEY và DATA_DIR như seed)
npm start &   # hoặc: npx tsx src/server.ts

# health
curl -s localhost:8080/api/health

# owners
curl -s localhost:8080/api/owners

# credential masked (thay <ownerId>)
curl -s localhost:8080/api/owners/<ownerId>/credentials

# execute flow demo (thay <templateId>, cần httpbin.org reachable)
curl -s -X POST localhost:8080/api/fetch/execute \
  -H 'content-type: application/json' \
  -d '{"ownerId":"<ownerId>","templateId":"<templateId>","params":{"repoName":"My Demo Repo"}}'

# extracted data
curl -s "localhost:8080/api/extractions?ownerId=<ownerId>"
```

## 3. Kỳ vọng smoke
- Health `{ ok:true }`.
- Credential list dạng masked (không plaintext).
- Execute flow → 2 step success (nếu có mạng ra httpbin), extract `echoedToken`, `repoName`; biến `github.lastRepo` được pin.
- History có bản ghi; Extractions có giá trị + template nguồn + thời điểm.

## 4. Kiểm tra ciphertext at-rest
```bash
grep -c "ghp_FAKE_DEMO" backend/.data/rtdb-keys.json   # phải = 0 nếu seed DATA_DIR=backend/.data
```
