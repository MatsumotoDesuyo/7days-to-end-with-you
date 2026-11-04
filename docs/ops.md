# 運用台帳 (アプリ側管轄のリソース)

アプリ側が所有する外部リソースの台帳。platform (my-server) 管轄のもの (VPS、GHCR、Grafana/Sentry の provisioning) は含まない。
方針: GA4 の計測の設計 (タグ・イベント) はアプリ側の管轄。GA のアカウント・プロパティの設定と資格情報はアプリ側に置かない
(設定変更は PO の画面か `to-org` の Issue、読み取りは platform の CLI を 7days 専用の身元 `app-7days` で。my-server#106 §11 の判断 6 (再改)、my-server#195)。
運用監視の Sentry/Grafana は platform の管轄。

## 本番サイト

- URL: **https://7days-to-decode.soncho-works.com/**
- 配信: GHCR イメージ (`server-<shortsha>`) を platform が release/run (DEPLOYMENT.md)

## Google Analytics (GA4) と Search Console

- 用途: プロダクト分析 (アクセス・言語別利用・流入)。設計は issue #12
- 旧測定 ID `G-VSBH50F0ZG` (index.html 直書き時代) と `G-70356QDZEN` (react-ga4 試行) は、
  現行の GA アカウントのどこにも属さない死んだ ID (2026-09 確認)。新プロパティで置換済み
- **現行**: アカウント `howel` (accounts/354084641) / プロパティ `7days-to-decode` (properties/552684947) /
  Web データストリーム (dataStreams/15664852217) / **測定 ID `G-HL1N4FK04L`** (2026-09-03 に Admin API で作成)
- Search Console: ドメイン プロパティ `sc-domain:7days-to-decode.soncho-works.com`
- **読み取り (7days 専用の身元 `app-7days`)**: platform が 7days 用に発行したサービス アカウント **`app-7days`** (鍵なし。
  なりすましで使う。my-server#195) で、作業 PC の my-server の clone の CLI から読む。この身元に見えるのは、上の GA4 プロパティ
  `552684947` (閲覧者) と Search Console の `sc-domain:7days-to-decode.soncho-works.com` (制限付きユーザー) だけで、読み取りのみ。
  他サイトのプロパティは HTTP 403 になるのが正しい。**コマンドには毎回 `--sa app-7days` を付ける** (会話の記録に身元が残る)。
  ```
  python C:/Projects/my-server/ops/bin/ga4-report.py report --sa app-7days --property 552684947     # 軸は --by page|date|host
  python C:/Projects/my-server/ops/bin/ga4-report.py properties --sa app-7days                      # 数値のプロパティ ID を引く
  python C:/Projects/my-server/ops/bin/gsc-report.py sites --sa app-7days
  python C:/Projects/my-server/ops/bin/gsc-report.py query --sa app-7days --site sc-domain:7days-to-decode.soncho-works.com
  ```
  (`gsc-report.py` は `sitemaps` / `inspect` も同じ形。フラグは各スクリプトの `--help`、前提は my-server の `ops/runbooks/google-api-credentials.md`)
  - `--sa` を省くと、my-server の外 (この repo の中など) からは exit 2 で止まる (身元を書き忘れて platform 用で読む事故の止め)。
    `--sa platform` は使わない。環境変数 `GOOGLE_SA` は 1 プロセスに限って使う口で、**User の環境変数には置かない** (置くと全セッションの既定が変わり、この止めも消える)。
  - 要るもの: gcloud のログイン (PO のアカウント)、User の環境変数 `GOOGLE_PLATFORM_SA` (account ID をメールにするのに使う)、
    my-server の clone が `--sa` を知っている版 (my-server#198 以降。my-server#195)。
  - `GOOGLE_PLATFORM_SA` は User の環境変数なので、設定より前に起動した VS Code (とその中の Claude のセッション) には入っていない。
    「`GOOGLE_PLATFORM_SA` が空」で失敗したら、VS Code を完全に再起動するか、User の値をプロセスに読み込んでから実行する
    (PowerShell: `$env:GOOGLE_PLATFORM_SA = [Environment]::GetEnvironmentVariable('GOOGLE_PLATFORM_SA', 'User')`)
  - clone が古い (`--sa` が無い) ときは、my-server の作業ツリーを触らず (`git pull` / checkout もしない。並行のセッションが使う共有の作業ツリー)、
    PO に頼むか、`to-platform` の Issue で更新を依頼する。
  - この身元は閲覧者 / 制限付きユーザー (スコープも `analytics.readonly` / `webmasters.readonly`) なので、設定変更には届かない (設定変更は下の経路)。
  - 身元の層の限界: PO のログインは platform 用を含むすべての SA になりすませるので、この身元で止まるのは書き忘れ・取り違えの事故と、
    トークンが漏れたときの届く範囲 (7days のプロパティだけ) まで。悪意の防御ではない。
- **設定変更** (GA4 のデータ ストリーム・カスタム ディメンション、Search Console のユーザーや sitemap の送信等): アプリの AI は行わない。PO が GA / Search Console の画面で行うか、
  このリポジトリに **`to-org`** ラベルの Issue で依頼する (ads.txt と同じ経路)

## GCP

- アプリ側の GCP 資源は無い (読み取りの身元 `app-7days` は platform の GCP プロジェクトにあり、platform が所有する。上の GA4 の節)
- 旧: 別の GCP プロジェクトにあった 7days 用の旧 SA (GA アカウント `howel` の編集者、JSON 鍵) と
  `analytics-ro` MCP は my-server#132 で撤去した (**2026-09-26 に撤去済み**。読み取りは上の CLI に一本化)。MCP の定義はこの repo から外した。
  GA の権限・SA・鍵ファイル・gcloud の登録はすべて削除した (手順と記録は my-server#132)。旧 SA があった GCP プロジェクトは別の用途で残っているが、7days とは関係しない

## AdSense

- AdSense アカウント・pub-ID・root `ads.txt`・CMP (同意管理) は**組織の資産** (ORGANIZATION.md)。
  アプリ側はスクリプトの組み込みと広告ユニットの配置のみを持つ
- **収益の値**: AdSense の権限はアカウント全体でしか切れないので、7days 用の身元は無い (アプリからは読まない)。
  収益の数値が要るときは、このリポジトリに **`to-platform`** の Issue を立てて頼み、platform が読んで渡す。
  このリポジトリは public なので、Issue・PR に収益の実額を書かない (桁や増減の向きまで。実額は private の場で受け渡す)
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

## 依存の自動更新 (Renovate・`main` のルールセット)

- 仕組み: Renovate (GitHub App) が `renovate.json` の設定で依存の更新の PR を作る。一覧と承認の窓口は Dependency Dashboard (#15)。
  導入と試行は #49、仕上げは #62 (値は 2026-11-04 に origin/main `14857d6` と GitHub の API で確かめた)
- 規則の正本は my-server の `ops/ai/renovate-automerge.md` (bot が自分で merge してよい範囲と条件) と
  `ops/ai/dependency-trust.md` (依存を足す・上げるときの物差し)。この節は値の台帳で、規則は写さない
- 実行: `schedule` `before 7am on saturday` (`:timezone(Asia/Tokyo)`)
- **自動 merge の範囲**: npm の minor/patch のまとめ PR (`groupName` `npm minor-and-patch`) のルールだけ。
  `automerge: true` / `automergeType: "pr"` / `platformAutomerge: false` / `automergeSchedule` `after 9am and before 9pm on saturday`。
  GitHub Actions・Dockerfile の minor/patch は別の PR (`actions-and-docker minor-and-patch`) で、自動 merge しない
- **7 日の待ち**: `minimumReleaseAge` `7 days`。PR では Renovate の check `renovate/stability-days` と、
  CI の job `release-age` (lock に新しく入る版の公開からの日数。`.github/scripts/release-age.mjs`) で見る
- メジャー: PR にせず Dependency Dashboard の承認待ちに並ぶ (`dependencyDashboardApproval: true`)。
  Node と `@types/node` のメジャーは無効 (`enabled: false`。上げると決めたらそのルールを消す)
- **`main` のルールセット** (id `24965959`、`active`): 必須の check は `test`・`image-smoke`・`release-age`
  (`.github/workflows/node.js.yml` の job)。素通りの役 (`bypass_actors`) は無い。`renovate/stability-days` は必須に入っていない。
  作った経緯と承認の記録は #69・#62 §11 (2026-10-13)
- **壊れたときの守りと戻し**:
  - PR の CI の `image-smoke` が、本番のイメージを build して起動を確かめる (`.github/scripts/image-smoke.sh`)
  - deploy の health の判定と直前のタグへの自動の戻し、常時の probe と #alerts への通知は platform の管轄
    (7days は `/api/health` を宣言済み。#53、DEPLOYMENT.md「リリースの受け渡し」「可視性」)
  - 動いた後に壊れたら、`main` への revert の PR で戻す (DEPLOYMENT.md「リリースの受け渡し」)
  - 自動 merge を止めたいときは、`renovate.json` の npm のまとめのルールから `automerge` を外す PR を出す
    (範囲を狭める向き。承認の形は my-server の `ops/ai/envelope.md` の依存更新の bot の設定の区画)
- **間接の依存の脆弱性**: 間接の依存だけを上げる PR は作られない (`lockFileMaintenance` を有効にしていない)。
  Dependabot alerts は有効で、開発用の一部は自動で却下される (`auto_dismissed`)。
  Dependabot security updates は無効 (2026-11-04 に `gh api repos/MatsumotoDesuyo/7days-to-end-with-you/automated-security-fixes` で `enabled: false`)。
  件ごとに lock を直した前例は #74・#89。直す仕組みは未定 (MatsumotoDesuyo/my-server#307 で決める)
- **見張りの Issue**: `gh issue list -R MatsumotoDesuyo/7days-to-end-with-you -l watch`
  (7days には部品の runbook が無いので `part:` は付けない)
