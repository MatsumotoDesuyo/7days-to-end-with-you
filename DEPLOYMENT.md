<!-- このファイルは my-server が管理する複製です。ここでは編集せず、正本 (my-server) 側で更新してください。 -->

# デプロイ契約 (app ↔ platform)

app と、それを運用する platform の**責任分担**と**可視性**を、The Twelve-Factor App と
OpenTelemetry を契約言語として定める。個別の判断は列挙せず、以下の原則から導出する。

## 原則 (責任 / 所有)

アプリは Twelve-Factor ワークロードである。十二の factor はアプリ側の義務であり、アプリがそれを満たす限り、platform はアプリ固有の知識なしに運用できる。受け渡しの境界は不変アーティファクトである (Factor V: build / release / run)。

## platform の義務

- アプリの *release* と *run* を提供する (設定・秘密の注入、配置、pull・起動、reverse proxy、TLS)。
- backing service を提供し、その backup と復元を担う。
- 監視の collection と通知経路、および共有 observability プレーンを提供する。
- 以上を、アプリが Twelve-Factor を満たす限り、アプリ固有の知識なしに汎用的に行う。

## アプリの義務

- Twelve-Factor ワークロードであること。*build* (不変アーティファクトの生成) を所有し、実行時契約を宣言する。
- 横断的関心事は該当する factor に従って intent と signal を宣言・emit する: Config (III) / Backing services (IV) / Processes (VI) / Disposability (IX) / Logs (XI) / Telemetry / Admin processes (XII)。
- ドメイン固有の価値判断 (何が異常か・何をいつ・何が永続状態か) を宣言する。

## 可視性 (Observability)

責任 (所有) と可視性は別の軸である。**収集の機構は platform が所有するが、telemetry (logs / metrics / traces / errors) は両者が読める。**

- アプリの基本義務は、ログを stdout にイベントとして出すこと (Factor XI) と、全 signal に `service=<name>` が付くこと。コンテナ単位の CPU / メモリと stdout ログは platform が **SDK なしで**収集する (cAdvisor / Alloy)。
- 信号は発生源で二分する。**基盤の信号** (host / コンテナの CPU・メモリ・ディスク・再起動、stdout ログ) は platform が Grafana で収集・判定・通知し、アプリに義務はない。**アプリの信号** (errors、リクエスト数・応答時間・エラー率、traces) はアプリが **Sentry SDK** (performance / tracing 有効) で emit する。platform は OTLP 等の受け口を持たず、アプリの metrics / traces は Sentry に集約する。SDK は数十 MB のメモリを使うため、規模の小さいサービスは platform と合意の上で省略できる (例外はサービスごとに明示する)。
- telemetry は単一の共有プレーンに集約され、platform とアプリの双方が (自サービスのスライスを) 読める。コピーを分けない。
- 他アプリのデータ・platform の秘密は隔離される (最小権限)。
- 資源の実使用は同じプレーンで読める: サービス別 CPU / メモリはダッシュボード `my-server-overview`、または `container_memory_working_set_bytes{service=<name>}` / `rate(container_cpu_usage_seconds_total{service=<name>}[5m])`。host 全体の容量と余裕は `node_memory_MemTotal_bytes` / `node_memory_MemAvailable_bytes`。現在、サービス別の上限は設けておらず host の余裕を共有している。上限を設ける場合は platform が宣言する。
- 閲覧先 (共有プレーン): logs / metrics は **Grafana** https://maroonkinkajou2355.grafana.net (Explore またはダッシュボード、`service=<name>` で絞り込む)。errors は **Sentry** https://watashihamatsumotodesu.sentry.io (project = サービス名)。
- **アプリ側のエージェントは、このリポジトリに `.mcp.json` が提供されている場合、そこに定義された read-only MCP で上記を直接読める**: `grafana-ro` (logs / metrics)、`sentry-ro` (errors)。自サービスの障害調査・エラー確認はまず両 MCP で自律的に行い、人に telemetry を貼ってもらう前提にしない。書き込み権限はなく、他サービスの秘密には届かない。
- platform が Discord (#alerts) に通知するのは閾値を超えたものだけ: 基盤は Grafana Alerting (メモリ余裕・CPU・再起動ループ)、アプリは Sentry の regression / 急増。日常のエラーは通知されないため、自サービスのエラーは `sentry-ro` で能動的に確認する。
- ローカル / 開発環境の Sentry: DSN は本番と同一 (project 単位) で、区別は `SENTRY_ENVIRONMENT` で行う (platform が run するものは `prod`、ローカルは `dev`)。platform の通知は `prod` の event だけを対象にするので、ローカルのエラーで #alerts は鳴らない。ローカルは既定で `SENTRY_DSN` 未設定 (SDK 無効) とし、SDK の配線を確かめたいときだけ設定する (無料枠は org 全体で共有のため)。DSN の値は `sentry-ro` (自分の project の Client Keys) で自分で参照できる。platform に問い合わせる必要はない。

## 導出ルール

「その責務は誰のものか」は次で判定する。

- 十二の factor のいずれか、またはドメイン固有の価値判断 → **アプリ** が宣言・emit する。
- その背後の *mechanism* / *execution* (pull・起動・proxy・TLS・backup・監視・通知・収集の実装) → **platform**。
- 「誰が見られるか」は所有と独立: そのサービスの telemetry は**両者が読める**。

## リリースの受け渡し (build → release)

build と release/run の境界は不変アーティファクトである (Factor V)。アプリは *build* を所有し、生成したアーティファクトの identity を platform に渡す。release と run (どこへ・どう配置するか) は platform が実行し、アプリはそれを知らない・触らない (ホストへの SSH も配置先の知識も持たない)。

- アプリはイメージに**不変のタグ**を付けて push する。タグはソースのリビジョン (git SHA) から一意に導かれ、再利用・再 push しない (floating タグ `latest` / `server` は release ではない)。現行の導出形式は `<role>-<shortsha>` (例 `server-3f2a1c9`。role は同一リポジトリから複数イメージを出す場合の区別)。build 成功後に platform へリリース対象 `(service, tag)` を通知する。通知は人格を持たない最小権限・短命の資格情報で行う。
- platform はそのタグを pin して release / run し、起動後の health 確認と、失敗時の直前タグへのロールバックを担う。
- **リリース履歴の正本は platform 側の台帳 (Git)** であり、ロールバックはその revert である。
- **ブランチ運用は GitHub Flow で統一する。** 長命ブランチは `main` だけで、常にデプロイ可能に保つ。作業は `main` から切った短命ブランチで行い、Pull Request で `main` に戻す。`develop` / `release/*` / `hotfix/*` は持たない (バージョン付きのリリース列を持たないため)。platform が release の起点にするのは `main` である: コンテナは `main` からの build が dispatch され、静的サイトは `main` への merge がそのまま本番デプロイになる。ロールバックは台帳の revert または配信側の版の巻き戻しで行い、ブランチでは行わない。

## 組織 (ドメイン横断の資産)

アプリと platform の他に、**組織** (soncho-works.com の所有者) という第三の役者がいる。

- **組織が所有**: ドメインと命名、メール、SaaS テナント (契約・課金・ログイン)、収益と法務 (AdSense アカウント・pub-ID・root の `ads.txt`・CMP/同意設定・privacy policy)、計測のアカウント (GA4 のアカウント)。
- **アプリが所有**: その資産を使うか、どこでどう使うか (広告の有無と配置、GA4 のプロパティ/タグ)。組織が発行した ID / スニペットを組み込む。**組織資産の正本をアプリに置かない**。
- **platform が所有**: 機構 (root 直下での配信、DNS レコード、証明書)。
- 組織の公開情報 (どのアプリがどの資産を使っているか) は `ORGANIZATION.md` として各アプリに複製される。秘密・契約・課金は渡されない。

## 変更の要望

契約 (アーティファクト・ポート・環境変数・emit する signal など) の変更や運用への要望は、そのアプリの Issue に起票する。宛先はラベルで分ける: 機構への要望は `to-platform`、組織資産への要望 (AdSense 参加・サブドメイン・GA4 プロパティ等) は `to-org`。受け手は同じだが、所有の区別を保つ。
