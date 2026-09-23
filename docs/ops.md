# 運用台帳 (アプリ側管轄のリソース)

アプリ側が所有する外部リソースの台帳。platform (my-server) 管轄のもの (VPS、GHCR、Grafana/Sentry の provisioning) は含まない。
方針: GA4 の計測の設計 (タグ・イベント) はアプリ側の管轄。GA のアカウント・プロパティの設定と資格情報はアプリ側に置かない
(設定変更は PO の画面か `to-org` の Issue、読み取りは platform の CLI。my-server#106 §11 の判断 6 (改)、my-server#132)。
運用監視の Sentry/Grafana は platform の管轄。

## 本番サイト

- URL: **https://7days-to-decode.soncho-works.com/**
- 配信: GHCR イメージ (`server-<shortsha>`) を platform が release/run (DEPLOYMENT.md)

## Google Analytics (GA4)

- 用途: プロダクト分析 (アクセス・言語別利用・流入)。設計は issue #12
- 旧測定 ID `G-VSBH50F0ZG` (index.html 直書き時代) と `G-70356QDZEN` (react-ga4 試行) は、
  現行の GA アカウントのどこにも属さない死んだ ID (2026-09 確認)。新プロパティで置換済み
- **現行**: アカウント `howel` (accounts/354084641) / プロパティ `7days-to-decode` (properties/552684947) /
  Web データストリーム (dataStreams/15664852217) / **測定 ID `G-HL1N4FK04L`** (2026-09-03 に Admin API で作成)
- **読み取り**: 作業 PC の my-server の clone の CLI で読む。
  `python C:/Projects/my-server/ops/bin/ga4-report.py report --property 552684947` (軸は `--by page|date|host`)。
  資格情報は platform 用 SA のなりすまし (鍵なし) で、アプリ側は持たない。要るもの: User の環境変数
  `GOOGLE_PLATFORM_SA`、gcloud のログイン、my-server の clone が my-server#148 以降の版であること。詳細は my-server の `ops/runbooks/google-api-credentials.md`
  - `GOOGLE_PLATFORM_SA` は User の環境変数なので、設定より前に起動した VS Code (とその中の Claude のセッション) には入っていない。
    「`GOOGLE_PLATFORM_SA` が空」で失敗したら、VS Code を完全に再起動するか、User の値をプロセスに読み込んでから実行する
    (PowerShell: `$env:GOOGLE_PLATFORM_SA = [Environment]::GetEnvironmentVariable('GOOGLE_PLATFORM_SA', 'User')`)
- **設定変更** (データ ストリーム、カスタム ディメンション等): アプリの AI は行わない。PO が GA の画面で行うか、
  このリポジトリに **`to-org`** ラベルの Issue で依頼する (ads.txt と同じ経路)

## GCP

- アプリ側の GCP 資源は無い
- 旧: `tools-475203` の SA `ga-agent-7days@tools-475203.iam.gserviceaccount.com` (GA アカウント `howel` の編集者、JSON 鍵) と
  `analytics-ro` MCP は my-server#132 で撤去する (読み取りは上の CLI に一本化)。MCP の定義はこの repo から外した。
  SA・鍵ファイル・gcloud の登録は PO が削除する (手順と記録は my-server#132)

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
