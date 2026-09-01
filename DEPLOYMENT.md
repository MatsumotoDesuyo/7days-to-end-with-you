# DEPLOYMENT

このアプリは外部プラットフォーム **my-server** が運用する。app ↔ platform の責任分担は
**The Twelve-Factor App** を契約言語として定める。個別の判断は列挙せず、以下の原則から
導出する。規範の正本と根拠は my-server:`docs/adr/0006`。

## 原則

1. **アプリは Twelve-Factor ワークロードである。** 十二の factor はアプリ側の義務であり、
   アプリがそれを満たす限り、プラットフォームはアプリ固有の知識なしに運用できる。

2. **Build / release / run (Factor V).** アプリは *build* を、プラットフォームは
   *release* と *run* を所有する。受け渡しの境界は不変アーティファクトである。

3. **横断的関心事は同じ軸で分割する。** アプリは該当 factor に従って intent と signal を
   宣言・emit し、プラットフォームが mechanism と execution を担う。
   - Config (III) — 設定・秘密
   - Backing services (IV) / Processes (VI) / Disposability (IX) — 永続状態と障害耐性
   - Logs (XI) / Telemetry (*Beyond the Twelve-Factor App*) — 監視
   - Admin processes (XII) — スケジュール

## 導出ルール

「アプリは X を所有・関知すべきか」は次で判定する。

- X が十二の factor のいずれかなら → **アプリの義務**（宣言・emit する）。
  その背後の *mechanism* は → プラットフォーム。
- X がドメイン固有の価値判断（何が異常か／何をいつ／何が永続状態か）なら → **アプリが宣言する**。
- それ以外の運用 *mechanism*（pull・起動・reverse proxy・TLS・backup・監視・通知の実装）は
  → プラットフォーム。

## プラットフォームへの依頼

契約（アーティファクト・ポート・必要な環境変数など）の変更や運用への要望は、
このリポジトリの Issue に起票すれば my-server 側が拾う。
