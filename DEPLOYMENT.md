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

- アプリはログを stdout にイベントとして出し (Factor XI)、telemetry は OpenTelemetry 形式で emit する。全 signal に `service=<name>` を付ける。
- telemetry は単一の共有プレーンに集約され、platform とアプリの双方が (自サービスのスライスを) 読める。コピーを分けない。
- 他アプリのデータ・platform の秘密は隔離される (最小権限)。
- 閲覧は共有 observability プレーン **Grafana** で行う: https://maroonkinkajou2355.grafana.net (Explore またはダッシュボード)。自分のサービスは `service=<name>` で絞り込む。

## 導出ルール

「その責務は誰のものか」は次で判定する。

- 十二の factor のいずれか、またはドメイン固有の価値判断 → **アプリ** が宣言・emit する。
- その背後の *mechanism* / *execution* (pull・起動・proxy・TLS・backup・監視・通知・収集の実装) → **platform**。
- 「誰が見られるか」は所有と独立: そのサービスの telemetry は**両者が読める**。

## 変更の要望

契約 (アーティファクト・ポート・環境変数・emit する signal など) の変更や運用への要望は、そのアプリの Issue に起票する。
