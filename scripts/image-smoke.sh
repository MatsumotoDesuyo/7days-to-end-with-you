#!/bin/bash
# イメージ E2E スモーク (#35)
#
# ルートの Dockerfile で本番イメージを build し、起動したコンテナに対して
#   1. GET / が SPA の index.html を返す (任意パスも SPA フォールバックで index.html)
#   2. GET /api/search-word が実辞書のヒットを返す (RQH -> one, api.test.ts と同じ実例)
#      GET /api/health が全辞書の照会を通して 200 を返す (N13 / #51)
#   3. SIGTERM で graceful shutdown する (exit code 0)
# を確認する。CI (.github/workflows/node.js.yml の job `image-smoke`) が PR と main への push のたびに動かす (#49)。
# 手元で動かすときは Docker が動く環境で: bash scripts/image-smoke.sh   (PORT 環境変数で待受ポートを変更可)
# 失敗したら、コンテナを消す前にコンテナの状態とログを出す (CI のログで原因を読むため)
set -eo pipefail
cd "$(dirname "$0")/.."

TAG=7days-smoke:local
NAME=7days-smoke
PORT="${PORT:-15501}"
BASE="http://localhost:$PORT"

cleanup() {
  local rc=$?
  if [ "$rc" != 0 ]; then
    echo "===== FAILED (exit $rc): container state and logs ====="
    docker inspect "$NAME" --format 'state={{.State.Status}} exit={{.State.ExitCode}}' 2>&1 || true
    docker logs --tail 100 "$NAME" 2>&1 || true
  fi
  docker rm -f "$NAME" >/dev/null 2>&1 || true
}

# 応答の本文を取る。接続できない・4xx/5xx・10 秒で応答しないときは失敗 (止まらないように -m を付ける)
fetch() {
  curl -fsS -m 10 "$BASE$1"
}

# 本文に期待の文字列が無ければ NG を出して落とす
expect() {
  local body="$1" needle="$2" what="$3"
  if ! grep -qF -- "$needle" <<<"$body"; then
    echo "NG: $what (expected: $needle)"
    exit 1
  fi
  echo "OK: $what"
}

echo '===== docker build ====='
docker build -t "$TAG" . >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
trap cleanup EXIT
docker run -d --name "$NAME" -p "$PORT:5001" "$TAG" >/dev/null

# 起動待ち (最大 30 秒)
for _ in $(seq 1 30); do
  if curl -fsS -m 2 "$BASE/" >/dev/null 2>&1; then break; fi
  sleep 1
done

echo '===== GET / (SPA) ====='
body=$(fetch "/") || { echo 'NG: GET / failed (container not serving)'; exit 1; }
expect "$body" '<div id="root">' 'index.html'

echo '===== GET /任意パス (SPA フォールバック) ====='
body=$(fetch "/some/client/route") || { echo 'NG: GET /some/client/route failed'; exit 1; }
expect "$body" '<div id="root">' 'fallback returns index.html'

echo '===== GET /api/search-word (実辞書) ====='
body=$(fetch "/api/search-word?word=RQH&lang=ja") || { echo 'NG: GET /api/search-word failed'; exit 1; }
expect "$body" '"word":"one"' 'dictionary hit (RQH -> one)'

echo '===== GET /api/health (全辞書, N13) ====='
body=$(fetch "/api/health") || { echo "NG: GET /api/health failed (not 200): $(curl -sS -m 10 "$BASE/api/health" 2>&1 || true)"; exit 1; }
expect "$body" '"status":"ok"' 'health 200 (all dictionaries)'

echo '===== SIGTERM graceful shutdown ====='
docker stop -t 10 "$NAME" >/dev/null
exit_code=$(docker inspect "$NAME" --format '{{.State.ExitCode}}')
if [ "$exit_code" != "0" ]; then
  echo "NG: exit code $exit_code (expected 0 after SIGTERM)"
  exit 1
fi
echo 'OK: graceful exit (code 0)'

echo 'ALL_SMOKE_PASSED'
