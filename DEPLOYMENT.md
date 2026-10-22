<!-- このファイルは my-server が管理する複製です。ここでは編集せず、正本 (my-server) 側で更新してください。 -->

# デプロイ契約 (app ↔ platform)

app と、それを運用する platform の**責任分担**と**可視性**を、The Twelve-Factor App と
OpenTelemetry を契約言語として定める。個別の判断は列挙せず、以下の原則から導出する。
この文書は各アプリに `DEPLOYMENT.md` として写る。括弧の中の ADR と Issue は platform (my-server) の記録で、決めた出どころを示す。文は、それを読まなくても決まりとして読める形に書く。

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
- 許せる害の値 (使えない状態の割合、収集の欠け) を宣言する。値を決めるのはアプリの PdM で、宣言の正本はアプリの側にある (my-server の `01_Vision/05_RiskBudget.md` の A1 の 2 段目)。platform は、その値を守らせる仕組みと検知の前提を持つ (同 A1 の 3 段目、`03_Architecture/04_Harness.md`)。my-server の値と、アプリの側にまだ宣言の無い値は、`01_Vision/05_RiskBudget.md` の §B にある。§B に無い種類は予算 0 (同 A3) (ADR 0031 決定 5)。

## 可視性 (Observability)

責任 (所有) と可視性は別の軸である。**収集の機構は platform が所有するが、telemetry (logs / metrics / traces / errors) は両者が読める。**

- アプリの基本義務は、ログを stdout にイベントとして出すこと (Factor XI) と、全 signal に `service=<name>` が付くこと。コンテナ単位の CPU / メモリと stdout ログは platform が **SDK なしで**収集する (cAdvisor / Alloy)。
- 信号は発生源で二分する。**基盤の信号** (host / コンテナの CPU・メモリ・ディスク・再起動、stdout ログ) は platform が Grafana で収集・判定・通知し、アプリに義務はない。**アプリの信号** (errors、リクエスト数・応答時間・エラー率、traces) はアプリが **Sentry SDK** (performance / tracing 有効) で emit する。platform は OTLP 等の受け口を持たず、アプリの metrics / traces は Sentry に集約する。SDK は数十 MB のメモリを使うため、規模の小さいサービスは platform と合意の上で省略できる (例外はサービスごとに明示する)。
- telemetry は単一の共有プレーンに集約され、platform とアプリの双方が (自サービスのスライスを) 読める。コピーを分けない。
- 自サービスの分は両者が読める。アプリが他のアプリのデータと platform の秘密にどこまで届くかは、導出ルールの 2 段の決まりで決まる (最小権限)。経路ごとの段の一覧は platform が持つ (my-server の `ops/runbooks/app-read-lines.md`。他のアプリの身元の名前などを含むので写しには載せず、アプリは自分の行を自分の docs に持つ)。2 段目で他のサービスの分も見える経路では、読むのを自サービスの分に絞り、他のサービスの値を Issue・PR に写さない。
- 資源の実使用は同じプレーンで読める: サービス別 CPU / メモリはダッシュボード `my-server-overview`、または `container_memory_working_set_bytes{service=<name>}` / `rate(container_cpu_usage_seconds_total{service=<name>}[5m])`。host 全体の容量と余裕は `node_memory_MemTotal_bytes` / `node_memory_MemAvailable_bytes`。サービス別の上限は原則として設けず、host の余裕を共有する。上限を設けるのは platform で、正本は my-server の `compose/apps/<アプリ>.yaml` の、そのサービスの `mem_limit` / `memswap_limit` (無ければ上限なし)。host 全体の容量の管理 (サービスの置き方と上限) は platform が持つ。アプリが host 全体の数字を読むのは、自サービスの不調の切り分けのため。メモリの使い方が大きく変わる変更の前には、アプリは host の余裕を見て、足りなくなりそうなら `to-platform` の Issue で知らせる。
- 閲覧先 (共有プレーン): logs / metrics は **Grafana** https://maroonkinkajou2355.grafana.net (Explore またはダッシュボード、`service=<name>` で絞り込む)。errors は **Sentry** https://watashihamatsumotodesu.sentry.io (project = サービス名)。
- **アプリ側のエージェントは、このリポジトリに `.mcp.json` が提供されている場合、そこに定義された read-only MCP で上記を直接読める**: `grafana-ro` (logs / metrics)、`sentry-ro` (errors)。自サービスの障害調査・エラー確認はまず両 MCP で自律的に行い、人に telemetry を貼ってもらう前提にしない。書き込み権限はなく、他サービスの秘密には届かない。`grafana-ro` はアプリごとの身元で (1 段目)、自サービスの logs / metrics と host 全体の容量の metrics (`node_*`) を読める。他サービスのログの型 (変わる部分を伏せた形) と metrics の名前は見えるが、ログの行と metrics の値には届かない。`sentry-ro` は全アプリで共通の身元で (2 段目。分けるには有料のプランが要る)、他サービスの project も読める。
- **流入と収益** (Search Console / GA4 / AdSense) も、2 段の決まりで読む。**流入 (Search Console / GA4) は自サービスの身元で読む** (1 段目): platform がアプリごとに発行するサービス アカウント (鍵なし。なりすましで使う) で、自サービスのプロパティにだけ閲覧の権限がある。他アプリのプロパティには届かない (発行は my-server#195)。Search Console のプロパティが他のアプリのサイトを含むとき (apex のドメイン プロパティはサブドメインを含む) は 2 段目で、身元を発行せず、platform が読んで渡す。読む道具は作業 PC の my-server の clone の CLI で、所有者のログインを借りて自サービスの身元になりすます: `ops/bin/gsc-report.py` (検索の表示回数・クリック・掲載順位、sitemap、URL 検査)、`ops/bin/ga4-report.py` (ページ別のビュー・セッション・ユーザー)。どちらも読み取りだけ (readonly のスコープに固定)。使う前提 (自サービスの身元の選び方を含む) は my-server の `ops/runbooks/google-api-credentials.md`。clone は platform の作業ツリーなので、アプリ側からは pull も checkout もしない。更新は作業 PC の持ち主に頼むか、`to-platform` の Issue で依頼する。資格情報はアプリの repo・CI・デプロイ先に置かないので、作業 PC の外 (CI 等) では今は読めない。**収益は経路で段が分かれる**: GA4 の収益の指標は、AdSense とリンクしたプロパティなら、流入と同じ自サービスの身元で読める (1 段目。プロパティ = サイトで絞れる。リンクは組織の資産の設定なので `to-org` で頼む)。AdSense の API は、権限がアカウント単位でサイトに絞れず、全サイトの収益が見えるので 2 段目で、platform だけが読む (`ops/bin/adsense-report.py`)。AdSense の値が要るときは `to-platform` の Issue で頼み、platform が読んで渡す (渡し方は実額の扱いの規則 (下) に従う。public のリポジトリに載る Issue には実額を書かず、桁や増減の向きにとどめる)。自サービスの Search Console の `siteUrl` と GA4 の測定 ID は `ORGANIZATION.md`。GA4 の API に渡す数値のプロパティ ID は `ORGANIZATION.md` には載せず、`ga4-report.py properties` で自サービスの身元から引く。MCP にするのは、CLI が常用になってから判断する。**アカウント側の設定** (Search Console / GA4 / AdSense のアカウントやプロパティの設定。組織の資産の上にある。「組織」節) の変更はアプリ側の権限に無い: `to-org` の Issue で依頼する (どう使うかを決めることと、アプリのコードに置くタグや広告の配置はアプリの所有)。収益の実額は public のリポジトリ (Issue・PR を含む) には書かない。private では記録の目的に応じて書いてよい。開発の Issue / PR には実額を要しないので、private でも書かない (my-server#106 §11 の判断 7)。
- platform が Discord (#alerts) に通知するのは閾値を超えたものだけ: 基盤は Grafana Alerting (メモリ余裕・CPU・再起動ループ、およびアプリが宣言した health エンドポイントの継続的な異常)、アプリは Sentry の regression / 急増と、アプリが `alert=p2` を付けた event の新規 issue。日常のエラーは通知されないため、自サービスのエラーは `sentry-ro` で能動的に確認する。
- 新規でも人の判断が要る event (health の失敗、外部取得の停止など、P2 に当たるもの) を Discord に届けたいアプリは、その event に tag `alert=p2` と、種類ごとの固定 fingerprint (例 `["<アプリ名>", "health-fail"]`) を付ける。同じ種類は 1 issue に集約され、その issue が新規になったときに 1 回だけ #alerts (無言) に流れる。送る頻度の抑制はアプリが持つ。再発を regression として届けるには project に auto-resolve (一定時間 event の無い issue を resolved にする) が要る。auto-resolve は project の全 issue に効くため、platform が Issue で依頼を受けて設定する (正本は my-server の `observability/sentry/workflows.json`)。
- platform が systemd タイマーで起動する定期処理は、成功したときだけ Healthchecks.io に ping する。期限までに成功の ping が無いと、#alerts に P2 (無言) で流れる。定期処理には 2 つの形があり、成功の判定が違う。
  - **HTTP エンドポイント**: 2xx が成功。判定は `curl -f` なので、400 以上が失敗で、3xx は成功として扱われる。
  - **使い捨てのジョブ** (タイマーから起動して、終了すると消えるコンテナ): 終了コード 0 が成功。それ以外は失敗として、期限を待たずにすぐ流れる。ただし、アプリが実行時の契約で「前段が未完了で、何もしなかった」と宣言したコードは、失敗にせず記録だけにする。成功とも数えないので、期限までに成功が無ければ DOWN になる。ジョブの stdout の最後の行は、ping の本文として Healthchecks.io (外部のサービス) に送られる。最後の行は結果の要約にし、秘密を含めない。

  何を失敗にするか (失敗の定義) はアプリの責務。一時的な部分失敗を成功として返すか、失敗にして通知に寄せるかはアプリが決める。対象のタイマーと許容時間の正本は my-server の `observability/healthchecks/checks.json` で、すべてのタイマーが対象ではない。
- ローカル / 開発環境の Sentry: DSN は本番と同一 (project 単位) で、区別は `SENTRY_ENVIRONMENT` で行う (platform が run するものは `prod`、ローカルは `dev`)。platform の通知は `prod` の event だけを対象にするので、ローカルのエラーで #alerts は鳴らない。ローカルは既定で `SENTRY_DSN` 未設定 (SDK 無効) とし、SDK の配線を確かめたいときだけ設定する (無料枠は org 全体で共有のため)。DSN の値は自分で参照できる: `SENTRY_VIEWER_TOKEN` で Sentry API `GET /api/0/projects/<org>/<project>/keys/` を読むか、Web UI (Settings → Projects → <project> → Client Keys) で見る (`sentry-ro` は読み取り専用に絞っているため DSN のツールを持たない)。platform に問い合わせる必要はない。

## 導出ルール

「その責務は誰のものか」は次で判定する。

- 十二の factor のいずれか、またはドメイン固有の価値判断 → **アプリ** が宣言・emit する。
- その背後の *mechanism* / *execution* (pull・起動・proxy・TLS・backup・監視・通知・収集の実装) → **platform**。
- 「誰が見られるか」は所有と独立: そのサービスの telemetry は**両者が読める**。
- 「アプリが何を、どの身元で読めるか」は 2 段で決める (ADR 0052)。**1 段目**: 読む身元をアプリごとに切り分けられる経路では、アプリは自サービスの分を自分の身元で読む。**2 段目**: 切り分けられない経路では、他のアプリに見えたときの害で決める。害があれば platform が持ち、要る分だけ渡す。害が小さければ、全アプリに同じ身元か同じ写しで渡すことがある。切り分けられるかは、提供側の機能で、今の支出の内で分けられるかで決める (分けるのに支出が要るとき、払うかは MO が決める)。2 段目の害の大小も MO が決める。platform と組織の秘密は、どの段でも在処だけを渡す。

## リリースの受け渡し (build → release)

build と release/run の境界は不変アーティファクトである (Factor V)。アプリは *build* を所有し、生成したアーティファクトの identity を platform に渡す。release と run (どこへ・どう配置するか) は platform が実行し、アプリはそれを知らない・触らない (配置先の知識も、ホストのシェルや書き込みの経路も持たない)。ホストの上の自サービスの分 (コンテナのログと状態、タイマーの結果、内部の API の読み取り) を読む要があるアプリには、platform がアプリ専用の読み取りの利用者を作り、決めたコマンドだけを許す (導出ルールの 2 段の決まりの 1 段目。他のアプリのコンテナ・環境変数・DB・ホストの設定には届かない。手順は my-server の `ops/runbooks/app-host-readers.md`)。

- アプリはイメージに**不変のタグ**を付けて push する。タグはソースのリビジョン (git SHA) から一意に導かれ、再利用・再 push しない (floating タグ `latest` / `server` は release ではない)。現行の導出形式は `<role>-<shortsha>` (例 `server-3f2a1c9`。role は同一リポジトリから複数イメージを出す場合の区別)。build 成功後に platform へリリース対象 `(service, tag)` を通知する。通知は人格を持たない最小権限・短命の資格情報で行う。
- platform はそのタグを pin して release / run し、起動後の health 確認と、失敗時の直前タグへのロールバックを担う。health はコンテナの状態 (crash-loop / 停止 / unhealthy) に加え、**アプリが health エンドポイントを宣言していればその HTTP ステータス**で判定する (200 = 成功、それ以外・接続不可・タイムアウト = 失敗。コンテナ判定 (起動 12 秒後) の後、最大 60 秒再試行する。本文は判定に使わない)。宣言は `ops/bin/remote-deploy.sh` の `health_url` に載せる。同じエンドポイントを Grafana Alerting が常時 probe する (`compose/alloy/config.alloy`)。
- **リリース履歴の正本は platform 側の台帳 (Git)** であり、platform のロールバックはその revert である。
- **ブランチ運用は GitHub Flow を基本とし、プロジェクトによっては Git Flow でもよい** (ADR 0060)。GitHub Flow では、長命ブランチは `main` だけで、常にデプロイ可能に保つ。作業は `main` から切った短命ブランチで行い、Pull Request で `main` に戻す。`develop` / `release/*` / `hotfix/*` は持たない。Git Flow では開発とリリースの branch を分け (例: リリースの branch を守るゲーム)、`develop` / `release/*` / `hotfix/*` を持てる。Git Flow にするプロジェクトは、そのことと本番の branch を platform に宣言する。platform が release の起点にするのは本番の branch で、GitHub Flow では `main` である: コンテナは本番の branch からの build が dispatch され、静的サイトは本番の branch への merge がそのまま本番デプロイになる。platform のロールバックは、台帳の revert か、配信側の版の巻き戻しで行う。アプリの側で戻すときは、本番の branch への revert の PR で行い、その merge からいつもの build と release が走る。どちらも、ブランチの付け替えでは行わない。
- **静的サイト (Cloudflare Workers Static Assets) の受け渡し**: アプリは配信ディレクトリと `wrangler.jsonc` を *build* の成果として渡す。`wrangler.jsonc` は**リポジトリ直下**に置く (platform は Workers Builds を既定コマンドで動かし、アプリ固有の引数を持たない。ADR 0014)。本番の branch (GitHub Flow では `main`) への push が本番デプロイで、それ以外のブランチは本番に出ない (version のアップロードかプレビュー。Worker の設定による)。**`workers.dev` 系の入口の開閉 (`workers_dev` / `preview_urls`) は platform が決める値で、置き場所が `wrangler.jsonc` でもアプリは変更しない** (ADR 0014 決定 5)。

## 組織 (ドメイン横断の資産)

アプリと platform の他に、**組織** (soncho-works.com と howel.jp の所有者) という第三の役者がいる (ADR 0011、ADR 0060)。

- **組織が所有**: ドメインと命名、メール、SaaS テナント (契約・課金・ログイン)、収益と法務 (AdSense アカウント・pub-ID・root の `ads.txt`・CMP/同意設定・privacy policy)、計測のアカウント (GA4 のアカウント)。
- **アプリが所有**: その資産を使うか、どこでどう使うか (広告の有無と配置、GA4 のプロパティ/タグ)。組織が発行した ID / スニペットを組み込む。**組織資産の正本をアプリに置かない**。
- **platform が所有**: 機構 (root 直下での配信、DNS レコード、証明書)。
- **クラウドのテナント** (AWS 等のアカウント) も SaaS テナントとして組織が所有する。その上の機構 (ジョブの実行環境、スケジューラ、秘密の保管) は platform が所有し、アプリは配置先もクラウドの資格情報も持たない。アプリが宣言するのはジョブの存在と実行時契約 (Factor XII) までで、ジョブの結果と stdout は共有プレーンで読む。
- 組織の公開情報 (どのアプリがどの資産を使っているか) は `ORGANIZATION.md` として各アプリに複製される。秘密・契約・課金は渡されない。この写しと契約の写し (`DEPLOYMENT.md`) は全アプリで同じなので 2 段目に当たり、他のアプリの情報は、見えても害が小さいもの (公開済みの値と名前) に限る。届く手がかりになる識別子 (数値のプロパティ ID、身元の名前) は載せない。

## 変更の要望

契約 (アーティファクト・ポート・環境変数・emit する signal など) の変更や運用への要望は、そのアプリの Issue に起票する。宛先はラベルで分ける: 機構への要望は `to-platform`、組織資産への要望 (AdSense 参加・サブドメイン・GA4 プロパティ等) は `to-org`。受け手は同じだが、所有の区別を保つ。platform がアプリの Issue に返す答えも、2 段の決まりに従う (他のアプリの情報は、害が小さいものだけを書く)。public のリポジトリの Issue・PR には、他のアプリの値と秘密の値を書かない (収益の実額は「流入と収益」のとおり)。
