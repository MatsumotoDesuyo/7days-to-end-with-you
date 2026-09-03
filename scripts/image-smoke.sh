#!/bin/bash
# イメージ E2E スモーク (#35)
#
# ルートの Dockerfile で本番イメージを build し、起動したコンテナに対して
#   1. GET / が SPA の index.html を返す
#   2. GET /api/search-word が実辞書のヒットを返す (RQH -> one, api.test.ts と同じ実例)
#   3. SIGTERM で graceful shutdown する (exit code 0)
# を確認する。CI には組み込んでおらず、Docker が動く環境でリリース前に手動実行する。
#   使い方: bash scripts/image-smoke.sh   (PORT 環境変数で待受ポートを変更可)
set -eo pipefail
cd "$(dirname "$0")/.."

TAG=7days-smoke:local
NAME=7days-smoke
PORT="${PORT:-15501}"

echo '===== docker build ====='
docker build -t "$TAG" . >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p "$PORT:5001" "$TAG" >/dev/null
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

# 起動待ち (最大 30 秒)
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORT/" >/dev/null 2>&1; then break; fi
  sleep 1
done

echo '===== GET / (SPA) ====='
curl -fsS "http://localhost:$PORT/" | grep -q '<div id="root">'
echo 'OK: index.html'

echo '===== GET /api/search-word (実辞書) ====='
body=$(curl -fsS "http://localhost:$PORT/api/search-word?word=RQH&lang=ja")
echo "$body" | grep -q '"word":"one"'
echo 'OK: dictionary hit (RQH -> one)'

echo '===== SIGTERM graceful shutdown ====='
docker stop -t 10 "$NAME" >/dev/null
exit_code=$(docker inspect "$NAME" --format '{{.State.ExitCode}}')
if [ "$exit_code" != "0" ]; then
  echo "NG: exit code $exit_code"
  exit 1
fi
echo 'OK: graceful exit (code 0)'

echo 'ALL_SMOKE_PASSED'
