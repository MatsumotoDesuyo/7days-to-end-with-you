<!-- このファイルは my-server が管理する複製です。ここでは編集せず、正本 (my-server) 側で更新してください。 -->

# 組織 (soncho-works.com と howel.jp) のカタログ

**組織**は、アプリ (意図) と platform (機構) に並ぶ第三の役者で、ドメイン横断の資産を所有する。
このファイルは組織の**公開情報**で、各アプリへ `ORGANIZATION.md` として複製される。秘密・契約・課金は含まない。

根拠の判例: my-server の ADR 0011 (組織という第三の役者と、最小のサービスカタログ)、ADR 0060 決定 5 (組織のドメインは soncho-works.com と howel.jp)

## 所有の原則 (要約)

| 役者 | 所有するもの |
|---|---|
| 組織 | ドメインと命名、メール、SaaS テナント、収益と法務 (AdSense・root `ads.txt`・CMP・privacy policy)、計測のアカウント |
| アプリ | その資産を使うか・どこでどう使うか。組織が発行した ID / スニペットの組み込み。組織資産の正本はアプリに置かない |
| platform | 機構 (root 直下の配信、DNS レコード、証明書、収集・通知) |

## カタログ

| アプリ (Component) | 公開ホスト | 配信 | Sentry project | Grafana `service` | AdSense | 計測 |
|---|---|---|---|---|---|---|
| d-data-server | d-data.soncho-works.com | v3 コンテナ + Caddy (予測ジョブ `d-data-batch` は v3 の使い捨てコンテナ、d-data-server#104) | `d-data-server` (予測ジョブも同じ project。サイドカー `d-data-fetch` は SDK なし。契約の例外: stdout ログのみ) | `d-data-server` (サイドカーは `d-data-fetch`、予測ジョブは `d-data-batch`) | なし | GA4 `G-EHNYF6X82V` |
| 7days-to-end-with-you | 7days-to-decode.soncho-works.com | v3 コンテナ + Caddy | `7days-server` | `7days-server` | **あり** (pub-9666515152781934) | GA4 `G-HL1N4FK04L` |
| map-scan-code | map-scan-code.soncho-works.com | Cloudflare Workers Static Assets | なし | なし (外形監視のみ) | **あり** (pub-9666515152781934、`/` のみ) | GA4 `G-V20P5EBEL7` |
| soncho-works-site | soncho-works.com (apex) | Cloudflare Workers Static Assets (2026-09-04 に WordPress から移行) | なし | なし (外形監視のみ) | **あり** (root `ads.txt` を配信) | Google タグ `GT-M6XHF7Q` (送り先は GA4 `G-1C9DJ3W5V2`。Google タグのコンテナ `https://www.googletagmanager.com/gtag/js?id=GT-M6XHF7Q` の中身と、受信側の Web ストリームの `defaultUri` の両方で確認 (2026-09-26)。タグの設定は API で読めない)、Search Console 検証あり |
| trinity-nexus | trinity-nexus.howel.jp | Cloudflare Workers Static Assets (本番の branch は `develop`。2026-10-23 に Cloudflare Pages から移行、my-server の ADR 0068) | なし | なし (外形監視のみ) | なし | GA4 `G-2Z7DTHP6Y1` (2026-10-27 から。my-server#571) |

### 計測の識別子 (読み経路で使う)

| アプリ | GA4 の測定 ID | Search Console の `siteUrl` |
|---|---|---|
| d-data-server | `G-EHNYF6X82V` | `sc-domain:d-data.soncho-works.com` |
| 7days-to-end-with-you | `G-HL1N4FK04L` | `sc-domain:7days-to-decode.soncho-works.com` |
| map-scan-code | `G-V20P5EBEL7` | `sc-domain:map-scan-code.soncho-works.com` |
| soncho-works-site | `G-1C9DJ3W5V2` (Google タグ `GT-M6XHF7Q` 経由。確かめ方は上の表の apex の行) | `sc-domain:soncho-works.com` |
| trinity-nexus | `G-2Z7DTHP6Y1` (読むのは platform だけ。アプリ用の身元は作っていない。my-server#571) | `sc-domain:trinity-nexus.howel.jp` (platform の読み経路の身元には付けていない。my-server#406) |

- Search Console は 5 つともドメイン プロパティ。`sc-domain:soncho-works.com` はサブドメインを含むので、apex だけを見るときはページの URL で読み分ける。
- GA4 の API に渡すのは数値のプロパティ ID で、測定 ID (`G-…` / `GT-…`) は渡せない。**数値のプロパティ ID はここには載せない** (アプリの運用に要らない。platform の読み経路が使う値で、正本は my-server の `ops/runbooks/google-api-credentials.md`。アプリの AI は自分のアプリの身元 (アプリ用の身元) で `ga4-report.py properties` を使って引ける。アプリ用の身元の無いアプリ (trinity-nexus) は、GA4 の値が要るときは `to-platform` の Issue で platform に頼む。この catalog は各アプリに複製され public にもなるため、アプリの運用に要らない識別子は配らない。PO の決定、2026-09-26)。測定 ID / Google タグはページの HTML で誰でも読める値で、ここに載せても露出は増えない。ただし測定 ID は誰でもヒットを送れる宛先なので、意図しないヒットは権限では防げない (my-server#151)。
- 読み経路 (誰がどの道具で読むか) は契約 (`DEPLOYMENT.md`)「可視性」。GA4 / Search Console の設定の変更や、プロパティの追加は `to-org` で依頼する。

## 組織が発行・配信するもの

- AdSense: Publisher ID `pub-9666515152781934`。root `ads.txt` は組織が正本を持ち、platform が root で配信する。
  参加するアプリは AdSense のスクリプトを組み込むだけ (CMP/同意メッセージは組織のアカウント設定で表示される)。
- サブドメイン: 命名は組織、レコード作成と証明書は platform。
- プライバシーポリシー: 組織がドメインごとに 1 つずつ持つ。アプリは個別のポリシーを持たない (固有事項があれば「本ポリシーに加えて」の形で補足する)。
  - soncho-works.com と全サブドメイン: 汎用版を **https://soncho-works.com/privacy/** で配信する。各アプリはこの URL へリンクする。
  - howel.jp と全サブドメイン: howel.jp 版 (my-server#571)。howel.jp の apex にはサイトが無いので、各サイトが自分の `/privacy/` に写しを持ち (アプリのサイトの静的ファイルの置き場 `public/` の下の `privacy/index.html`。repo の直下とは限らない。platform が正本から PR で届ける。アプリでは編集しない)、そこへリンクする。今は **https://trinity-nexus.howel.jp/privacy/**。
- 同意 (EEA・英国・スイスの訪問者): soncho-works.com のサイトは、AdSense の同意メッセージ (上の AdSense の項)。howel.jp のサイトは、Google アナリティクスの同意モードで、その地域の既定を拒否にする (Google アナリティクスの Cookie を使わない。同意のバナーは出さない。my-server#571)。この既定をタグに書くのはアプリ。
- 公開連絡先: エンドユーザーや権利者に向けて公開する窓口 (フッター、プライバシーの補足、削除要請の受付) には、各アプリが自分のドメインの連絡先を掲載する。
  連絡先はドメインごとに下のものに統一し、アプリ独自の窓口を作らない。X などほかの窓口を併記するかは各アプリの判断。
  - soncho-works.com のサイト: **watashihamatsumotodesu@gmail.com** (soncho-works.com のポリシーの「連絡先」と同じ)。
  - howel.jp のサイト: **お問い合わせフォーム** https://docs.google.com/forms/d/e/1FAIpQLSfxd6aqYEXd3UnhXXLf9eWMNsJKsvxx8sudn6PiSIEfnGo2Lg/viewform (howel.jp のポリシーの「連絡先」と同じ。my-server#571)。
  運用の通知先 (エラー通知・証明書・SaaS からのメール) は、この項目では定めない。

## 組織への要望

そのアプリの Issue に **`to-org`** ラベルで起票する (例: AdSense に参加したい、サブドメインが欲しい、GA4 のプロパティが欲しい)。
platform への要望は `to-platform`。受け手は同じだが、所有の区別を保つ。
