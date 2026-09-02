# 7days-to-end-with-you

『7 Days to End with You』の暗号解読補助ツール。詳細は docs/ を必ず参照:

- [docs/use-cases.md](docs/use-cases.md) — 何が「正常」か (N1-N9)。仕様変更はまずここから
- [docs/test-cases.md](docs/test-cases.md) — テストの層 (UCT/UT) と目標。テスト名の ID はここと対応
- [docs/game-overview.md](docs/game-overview.md) — ゲーム自体の仕様 (Z スキップの 25 文字周期など)。Web を再調査しないこと
- [DEPLOYMENT.md](DEPLOYMENT.md) — platform との契約 (Twelve-Factor)。**このファイルは編集禁止** (platform 管理の複製)

## 構成 (npm workspaces)

| workspace | 役割 |
|-----------|------|
| shared/ | コアロジック (analyse-sentense)。tsc で dist/ へビルドし client/server が参照 |
| server/ | Express + sqlite3 (同梱辞書 ejdict)。API は /api/search-word の 1 本 |
| client/ | React SPA (Vite + MUI)。ビルド成果物は Docker で server/public へ焼き込まれる |

## コマンド (ルートで実行)

- `npm ci` — 全 workspace の依存を導入
- `npm run build` — shared → server → client の順にビルド (この順序が必要)
- `npm test` — 全テスト (pretest で shared をビルド)。カバレッジゲートあり
- `npm run lint` — 全 workspace の ESLint
- 開発: `npm run dev:server` (port 5001) + `npm run dev:client` (port 3000、/api は 5001 へプロキシ)

## 検証の流儀 (重要)

- ローカル実機 (Windows) では検証せず、**CI と同じ Linux + Node 22 の Docker コンテナで検証**する
- 挙動を変更する PR は use-cases.md → test-cases.md → テスト → 実装の順で同時更新する
- 仕様かバグか曖昧な挙動は勝手に直さない。ユーザーの判断を仰ぐ
- 合格ライン: push → CI 緑 (lint + build + テスト) → GHCR イメージ自動更新

## 実行時契約 (アプリ側)

- ポート: 環境変数 `PORT` (デフォルト 5001) / ログ: stdout のみ / SIGTERM・SIGINT で graceful shutdown
- エラーは Sentry へ emit (#14)。`SENTRY_DSN` / `SENTRY_ENVIRONMENT` / `SENTRY_RELEASE` は platform が注入し、未設定時 (ローカル・CI) は無効。参照は sentry-ro MCP (org: howel, project: 7days-server)
- 障害調査・エラー確認は、人に telemetry を貼ってもらう前に **sentry-ro (errors) / grafana-ro (logs・metrics) の MCP でまず自律的に行う** (DEPLOYMENT.md「可視性」)。日常エラーは Discord に通知されないため能動確認が前提
- 運用への要望・契約変更はこのリポジトリの Issue に起票する
