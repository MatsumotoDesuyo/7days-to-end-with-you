<!-- このファイルは my-server/docs/deployment-contract.md から生成された複製です。ここでは編集せず、正本を編集して ops/bin/sync-deployment-doc.sh を実行してください。 -->

# デプロイ契約 (app ↔ platform)

my-server はアプリを運用する**プラットフォーム**である。プラットフォームと各アプリの
責任分担を **The Twelve-Factor App** を契約言語として定める。これが規範の正本であり、
各アプリの `DEPLOYMENT.md` はここからの複製 (`ops/bin/sync-deployment-doc.sh`)。
決定の根拠は `docs/adr/0006`。

## 原則

アプリは Twelve-Factor ワークロードである。十二の factor はアプリ側の義務であり、
アプリがそれを満たす限り、プラットフォームはアプリ固有の知識なしに運用できる。
受け渡しの境界は不変アーティファクト (Factor V: build / release / run)。

## プラットフォーム (my-server) の義務

- アプリの *release* と *run* を提供する: 設定・秘密の注入、配置、pull・起動、
  reverse proxy、TLS。
- backing service を提供し、その backup と復元を担う。
- 監視の collection と通知経路を提供する。
- 以上を、アプリが Twelve-Factor を満たす限り、アプリ固有の知識なしに汎用的に行う。

## アプリの義務

- Twelve-Factor ワークロードであること。*build* (不変アーティファクトの生成) を所有し、
  実行時契約を宣言する。
- 横断的関心事は該当 factor に従って intent と signal を宣言・emit する:
  Config (III) / Backing services (IV) / Processes (VI) / Disposability (IX) /
  Logs (XI) / Telemetry / Admin processes (XII)。
- ドメイン固有の価値判断 (何が異常か・何をいつ・何が永続状態か) を宣言する。

## 導出ルール

「その責務は誰のものか」は次で判定する。

- 十二の factor のいずれか、またはドメイン固有の価値判断 → **アプリ** (宣言・emit)。
- その背後の *mechanism* / *execution* (pull・起動・proxy・TLS・backup・監視・通知の実装)
  → **プラットフォーム**。

## 変更

このファイルが正本。変更はここで行い `sync` する。個別アプリからの要望は各アプリの Issue へ。
