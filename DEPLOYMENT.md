<!-- このファイルはプラットフォーム (my-server) が管理する複製です。ここでは編集せず、プラットフォーム側で更新してください。 -->

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
- 信号は発生源で二分する (ADR 0010)。**基盤の信号** (host / コンテナの CPU・メモリ・ディスク・再起動、stdout ログ) は platform が Grafana で収集・判定・通知し、アプリに義務はない。**アプリの信号** (errors、リクエスト数・応答時間・エラー率、traces) はアプリが **Sentry SDK** (performance / tracing 有効) で emit する。platform は OTLP 等の受け口を持たず、アプリの metrics / traces は Sentry に集約する。SDK は数十 MB のメモリを使うため、規模の小さいサービスは platform と合意の上で省略できる (例外はサービスごとに明示する)。
- telemetry は単一の共有プレーンに集約され、platform とアプリの双方が (自サービスのスライスを) 読める。コピーを分けない。
- 他アプリのデータ・platform の秘密は隔離される (最小権限)。
- 資源の実使用は同じプレーンで読める: サービス別 CPU / メモリはダッシュボード `my-server-overview`、または `container_memory_working_set_bytes{service=<name>}` / `rate(container_cpu_usage_seconds_total{service=<name>}[5m])`。host 全体の容量と余裕は `node_memory_MemTotal_bytes` / `node_memory_MemAvailable_bytes`。現在、サービス別の上限は設けておらず host の余裕を共有している。上限を設ける場合は platform が宣言する。
- 閲覧先 (共有プレーン): logs / metrics は **Grafana** https://maroonkinkajou2355.grafana.net (Explore またはダッシュボード、`service=<name>` で絞り込む)。errors は **Sentry** https://howel.sentry.io (project = サービス名)。
- **アプリ側のエージェントは、このリポジトリに `.mcp.json` が提供されている場合、そこに定義された read-only MCP で上記を直接読める**: `grafana-ro` (logs / metrics)、`sentry-ro` (errors)。自サービスの障害調査・エラー確認はまず両 MCP で自律的に行い、人に telemetry を貼ってもらう前提にしない。書き込み権限はなく、他サービスの秘密には届かない。
- platform が Discord (#alerts) に通知するのは閾値を超えたものだけ: 基盤は Grafana Alerting (メモリ余裕・CPU・再起動ループ)、アプリは Sentry の regression / 急増。日常のエラーは通知されないため、自サービスのエラーは `sentry-ro` で能動的に確認する。

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
- 根拠と機構は ADR 0008。

## 変更の要望

契約 (アーティファクト・ポート・環境変数・emit する signal など) の変更や運用への要望は、そのアプリの Issue に起票する。
