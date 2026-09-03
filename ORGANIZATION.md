<!-- このファイルは my-server が管理する複製です。ここでは編集せず、正本 (my-server) 側で更新してください。 -->

# 組織 (soncho-works.com) のカタログ

**組織**は、アプリ (意図) と platform (機構) に並ぶ第三の役者で、ドメイン横断の資産を所有する。
このファイルは組織の**公開情報**で、各アプリへ `ORGANIZATION.md` として複製される。秘密・契約・課金は含まない。

## 所有の原則 (要約)

| 役者 | 所有するもの |
|---|---|
| 組織 | ドメインと命名、メール、SaaS テナント、収益と法務 (AdSense・root `ads.txt`・CMP・privacy policy)、計測のアカウント |
| アプリ | その資産を使うか・どこでどう使うか。組織が発行した ID / スニペットの組み込み。組織資産の正本はアプリに置かない |
| platform | 機構 (root 直下の配信、DNS レコード、証明書、収集・通知) |

## カタログ

| アプリ (Component) | 公開ホスト | 配信 | Sentry project | Grafana `service` | AdSense | 計測 |
|---|---|---|---|---|---|---|
| d-data-server | d-data.soncho-works.com | v3 コンテナ + Caddy | `d-data-server` | `d-data-server` | なし | なし |
| 7days-to-end-with-you | 7days-to-decode.soncho-works.com | v3 コンテナ + Caddy | `7days-server` | `7days-server` | **あり** (pub-9666515152781934) | GA4 (アプリ側で設計中) |
| map-scan-code | map-scan-code.soncho-works.com | Cloudflare Workers Static Assets | なし | なし (外形監視のみ) | なし | なし |
| (apex) WordPress | soncho-works.com | 旧サーバー → 静的サイトへ移行予定 | なし | なし | root `ads.txt` を配信 | Search Console 検証あり |

## 組織が発行・配信するもの

- AdSense: Publisher ID `pub-9666515152781934`。root `ads.txt` は組織が正本を持ち、platform が root で配信する。
  参加するアプリは AdSense のスクリプトを組み込むだけ (CMP/同意メッセージは組織のアカウント設定で表示される)。
- サブドメイン: 命名は組織、レコード作成と証明書は platform。
- プライバシーポリシー: soncho-works.com と全サブドメインに適用する汎用版を組織が持ち、**https://soncho-works.com/privacy/** で配信する。
  各アプリはこの URL へリンクする (個別のポリシーを持たない。固有事項があれば「本ポリシーに加えて」の形で補足する)。

## 組織への要望

そのアプリの Issue に **`to-org`** ラベルで起票する (例: AdSense に参加したい、サブドメインが欲しい、GA4 のプロパティが欲しい)。
platform への要望は `to-platform`。受け手は同じだが、所有の区別を保つ。
