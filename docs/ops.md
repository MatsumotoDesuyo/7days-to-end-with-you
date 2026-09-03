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

- AdSense アカウント・pub-ID・root `ads.txt`・CMP (同意管理) は**組織の資産** (ORGANIZATION.md)。
  アプリ側はスクリプトの組み込みと広告ユニットの配置のみを持つ
- パブリッシャー ID: `ca-pub-9666515152781934` (client/index.html。発行元は組織)
- 広告ユニット: 手動 1 ユニットのみ (スロット `8476370284`、components/ad-unit)。
  自動広告は `soncho-works.com` ドメイン単位でオフ済み (2026-09-03)
- プライバシーポリシー: 正本は**組織**の汎用版 https://soncho-works.com/privacy/ (#37)。
  フッターの "Privacy Policy" はここを指す。アプリ側の
  `client/public/privacy.html` は、汎用版にない固有の取り扱い
  (表示言語の localStorage 保存) だけを書いた**補足ページ**
  (フッターの "Supplement")。本文の変更が必要なら `to-org` で依頼する
- **ads.txt**: 正本は組織 (my-server の `org/ads.txt`) に移管済み (#36、2026-09)。
  root (`https://soncho-works.com/ads.txt`) で配信中。アプリ側の複製
  (client/public/ads.txt) は役目を終えたため削除した。広告システムの追加等で
  行の変更が必要になったら、このリポジトリの Issue に **`to-org`** ラベルで申告する
