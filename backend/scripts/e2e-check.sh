#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."   # app/backend
pkill -f "tsx src/server" 2>/dev/null || true
sleep 1
rm -rf .data
mkdir -p .run
KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
export API_FETCH_MANAGER_ENCRYPTION_KEY="$KEY"
export API_FETCH_MANAGER_STORAGE_MODE=file
export API_FETCH_MANAGER_DATA_DIR=.data
export API_FETCH_MANAGER_PORT=8096

echo "### seed"
npx tsx scripts/seed-smoke.ts 2>&1 | tail -2

echo "### start server"
npx tsx src/server.ts > .run/e2e.log 2>&1 &
SRV=$!
sleep 6

OID=$(curl -s localhost:8096/api/owners | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data[0].id))")
TID=$(curl -s localhost:8096/api/templates | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data[0].id))")
echo "owner=$OID template=$TID"

echo "### masked credentials"
curl -s localhost:8096/api/owners/$OID/credentials

echo ""
echo "### execute 2-step flow"
curl -s -X POST localhost:8096/api/fetch/execute -H 'content-type: application/json' \
  -d "{\"ownerId\":\"$OID\",\"templateId\":\"$TID\",\"params\":{\"repoName\":\"My Demo Repo\"}}"

echo ""
echo "### extractions"
curl -s "localhost:8096/api/extractions?ownerId=$OID"

echo ""
kill $SRV 2>/dev/null || true
echo "### stopped"
