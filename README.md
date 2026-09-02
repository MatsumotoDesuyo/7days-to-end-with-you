# 7days-to-end-with-you

『7 Days to End with You』の暗号解読補助ツール。
ゲーム内言語（英語ベースのシーザー暗号）の全シフト候補を提示し、簡易辞書にある単語を意味つきで表示する。
答えを教えるのではなく候補の提示に留めることで、ゲーム本来の「読み解く楽しみ」を壊さない設計。

## 構成

npm workspaces のモノレポ: `shared/`（コアロジック）、`server/`（Express + sqlite3）、`client/`（React + Vite）。
詳細は [CLAUDE.md](CLAUDE.md) と [docs/](docs/) を参照。

## 開発

```bash
npm ci
npm run build        # shared → server → client
npm test             # 全テスト (カバレッジゲートあり)
npm run dev:server   # localhost:5001
npm run dev:client   # localhost:3000 (/api は 5001 へプロキシ)
```

## デプロイ

push で CI（lint / build / test）が回り、ルートの `Dockerfile` から client 焼き込み済みの単一イメージが GHCR へ push される。
運用の責任分担は [DEPLOYMENT.md](DEPLOYMENT.md)（platform 管理・編集禁止）を参照。
