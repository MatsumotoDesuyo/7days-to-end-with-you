# 運用台帳 (アプリ側管轄のリソース)

アプリ側が所有する外部リソースの台帳。platform (my-server) 管轄のもの (VPS、GHCR、Grafana/Sentry の provisioning) は含まない。
方針: product analytics (GA) とその資格情報はアプリ側の管轄 (運用監視の Sentry/Grafana は platform 管轄)。

## 本番サイト

- URL: **https://7days-to-decode.soncho-works.com/**
- 配信: GHCR イメージ (`server-<shortsha>`) を platform が release/run (DEPLOYMENT.md)

## Google Analytics (GA4)

- 用途: プロダクト分析 (アクセス・言語別利用・流入)。設計は issue #12
- 旧測定 ID `G-VSBH50F0ZG` (index.html 直書き時代) と `G-70356QDZEN` (react-ga4 試行) は、
  現行の GA アカウントのどこにも属さない死んだ ID (2026-09 確認)。新プロパティで置換済み
- **現行**: アカウント `howel` (accounts/354084641) / プロパティ `7days-to-decode` (properties/552684947) /
  Web データストリーム (dataStreams/15664852217) / **測定 ID `G-HL1N4FK04L`** (2026-09-03 に Admin API で作成)

## GCP (GA 委託用)

- プロジェクト: `tools-475203` (既存のツール用プロジェクトに相乗り)
- 有効化 API: Analytics Admin API / Analytics Data API
- サービスアカウント: `ga-agent-7days@tools-475203.iam.gserviceaccount.com`
  - GCP 側ロール: なし (GCP リソースには何の権限も持たない)
  - GA 側権限: GA アカウントの「編集者」(アカウントのアクセス管理で付与)
- JSON キー: `%USERPROFILE%\.config\ga\ga-sa.json` (ローカルのみ・リポジトリ外)
  - 漏洩時の対処: GCP コンソール (または gcloud) でキーを削除し再発行。GA 側の権限剥奪でも無効化できる
- 用途: AI エージェントによる GA の設定変更 (Admin API) とレポート閲覧 (Data API / analytics-mcp)

## AdSense

- パブリッシャー ID: `ca-pub-9666515152781934` (client/index.html)
- 広告ユニット: 手動 1 ユニットのみ (スロット `8476370284`、components/ad-unit)。
  自動広告は `soncho-works.com` ドメイン単位でオフ済み (2026-09-03)
- 同意管理: Google CMP (EEA/UK 限定配信) — AdSense コンソールで管理
- プライバシーポリシー: https://7days-to-decode.soncho-works.com/privacy.html
  (正本: client/public/privacy.html。CMP のポリシー URL にもこれを設定)
- **ads.txt**: 内容の正本はこのリポジトリの `client/public/ads.txt`。
  AdSense の仕様上、クローラーが参照するのは**ルートドメイン直下**
  (`https://soncho-works.com/ads.txt`) のため、そこへの配置は platform へ
  運用依頼する (このリポジトリの Issue で依頼・追跡)。行の内容が変わったら
  正本を更新し、同様に platform へ依頼する
