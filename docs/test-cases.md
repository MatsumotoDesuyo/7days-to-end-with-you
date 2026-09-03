# テストケース定義

[use-cases.md](use-cases.md) が「何が正常か」を定めるのに対し、本書は「それをどう検証するか」を定める。
文書の連なり: **use-cases.md（正常の定義）→ 本書（検証方法の定義）→ テストコード（実装）**。

## 保存形式について（検討結果）

リポジトリ内 `docs/` の Markdown とする。理由:

- テストコードと**同じコミット/PR で更新・レビューできる**（外部ツールだと乖離する）
- AI・人間の双方が参照しやすく、差分が追える
- 本書の ID（UCT-xx / UT-xx）をテストコードの `describe`/`test` 名に併記して対応付ける（既存テストへの ID 付与は #13 で実施）

## 1. テストの層

| 層 | 検証対象 | 実行環境 |
|---|---|---|
| ユースケーステスト (UCT) | ユーザーから見たフロー。UI 操作や API 呼び出しを通す | client: Vitest + @testing-library/react (jsdom) / server: 実サーバー + 実辞書へのブラックボックス HTTP |
| ユニットテスト (UT) | 個別機能の入出力 | Vitest |

いずれも CI（Node 22、[node.js.yml](../.github/workflows/node.js.yml)）でモノレポ全体として実行される。

## 2. ユースケーステスト

| ID | 検証フロー | 対応 | 実装 | 状態 |
|----|-----------|------|------|------|
| UCT-01 | 記号ボタンで文字を入力すると、入力が連結され全 26 シフトの候補リストが表示される | UC1, N3 | client `pages/home/index.test.tsx`, `components/suggest-text-list/index.test.tsx` | 済 |
| UCT-02 | テキスト欄に直接タイプすると、英字のみ抽出・大文字化されて候補リストに反映される | UC2, N7 | client `pages/home/index.test.tsx` | 済 |
| UCT-03 | 辞書検索すると、シフト候補由来の単語だけが意味つきで返り、シフト候補リストより上に表示される | UC3, N4, N9 | client `pages/home/index.test.tsx`（表示・API 呼び出し）+ server `src/api.test.ts`（実辞書でのヒット内容） | 済 |
| UCT-04 | 辞書ヒット 0 件のとき「見つかりませんでした」と表示される | UC3 | client `components/suggest-word-list/index.test.tsx` | 済 |
| UCT-05 | BackSpace で末尾 1 文字が消える。入力変更で辞書結果がリセットされる | UC4 | client `pages/home/index.test.tsx` | 済 |
| UCT-06 | 空入力・word なしで辞書検索してもサーバーは落ちず空応答を返す | N8 | server `src/api.test.ts` | 済 |
| UCT-07 | ヒット件数は 100 件以下 | N5 | server `src/api.test.ts` | 済 |
| UCT-08 | `PORT` 環境変数で待受ポートを変更できる（デフォルト 5001） | Factor III (#7) | server `src/api.test.ts`（PORT 上書きで起動して全 API テストを実行） | 済 |
| UCT-09 | 言語セレクタで 8 言語が切り替わり、選択が保存される | UC5, N10 | client `pages/home/index.test.tsx` | 済（#2） |
| UCT-10 | 辞書検索が選択言語の辞書を引く（en=英英 / fr=訳語+語義 / 未対応は ja へフォールバック）。機能語・数詞の独自補完（you、es の数詞）もヒットする | UC3, N9, N10 | server `src/api.test.ts`（実辞書） + `src/search-word.test.ts`（リゾルバ単体） | 済（#2） |

## 3. ユニットテスト

| ID | 対象機能 | 検証内容 | 実装 | 状態 |
|----|---------|---------|------|------|
| UT-01 | analyse-sentense (shared) | N1: 25 文字周期・Z 非到達・実例復号 / N2: Z 入力の mod 26 / N3: 26 候補 / 小文字の観測挙動 | shared `src/analyse-sentense.test.ts` | 済（カバレッジ 100%） |
| UT-02 | （欠番） | 実装が shared パッケージへ一本化されたため UT-01 に統合（#11） | — | — |
| UT-03 | 入力正規化 (showAnalyzeText) | 非英字をすべて除去して大文字化（#4 で変更） | client `pages/home/index.test.tsx`（コンポーネント経由） | 済 |
| UT-04 | SuggestTextList | 26 行表示・ずらし量と行の対応・空入力時は非表示 | client `components/suggest-text-list/index.test.tsx` | 済 |
| UT-05 | SuggestWordList | null/0 件/ヒットありの 3 状態の表示 | client `components/suggest-word-list/index.test.tsx` | 済 |
| UT-06 | ImageKeyboard | 全 26 ボタンが対応する大文字でコールバックを呼ぶ・BackSpace・記号画像の表示 | client `components/image-keyboard/index.test.tsx` | 済 |
| UT-07 | logger | ログが stdout へ出力されること（Factor XI の契約） | server `src/logger.test.ts` | 済 |
| UT-08 | search-word ハンドラ | SQL エラー時（prepare 段階・実行段階のどちらでも）に 500 + 空配列で必ず応答し、プロセスは落ちない。成功時は候補 26 件（小文字）で照会しヒット行を返す | server `src/search-word.test.ts`（db 注入のファクトリ化により単体検証。node:sqlite 移行後は同期 API のため、フェイク DB は prepare/all が例外を投げる形で検証する #35） | 済（#3） |
| UT-09 | 初期言語の解決 (resolveInitialLang) | 保存済み選択が最優先、なければブラウザ言語（対応言語に前方一致、なければ en） | client `src/i18n.test.ts` | 済（#2） |
| UT-10 | Sentry 初期化 (instrument) | `SENTRY_DSN` 未設定なら init しない。設定時は dsn/environment/release + tracing (tracesSampleRate) で init する | server `src/instrument.test.ts` | 済（#14） |
| UT-11 | GA 初期化・イベント (ga) | 本番ビルド以外・ID 空では何もしない。本番では consent デフォルト（EEA/UK/CH 拒否）→ config の順で初期化し gtag スクリプトをロード。イベントは初期化後のみ `dict_search`/`language_change` を送信 | client `src/ga.test.ts` | 済（#12） |
| UT-12 | 広告ユニット (AdUnit) | 本番以外では実広告をロードせず高さのみ確保。本番では正しい client/slot 属性の 1 ユニットを描画し adsbygoogle に 1 回 push。高さ予約で CLS を防ぐ | client `components/ad-unit/index.test.tsx` | 済（#12） |

## 4. テスト目標

- **カバレッジは CI でゲート済み**（Vitest coverage thresholds、#13 で導入・#11 で移設）:
  - コアロジック（shared の analyse-sentense）: **100%**（statements/branches/functions/lines）
  - client / server とも global: statements 95 / lines 95 / functions 90 / branches 80
  - 集計除外: client の `index.tsx`/`Router.tsx`（エントリの glue、実機スモークで検証）、server の `index.ts`（HTTP 層、ブラックボックス API テストで検証）、shared の `index.ts`（バレル）
- テスト名には本書の ID（UCT-xx / UT-xx）を describe/test 名に併記する（#13 で付与済み）
- 運用ルール: **挙動を変更する PR は対応するテスト更新を伴う。新規ロジックはテスト同伴**。仕様変更時は use-cases.md → 本書 → テストコードの順に更新する
- 補足: server の index.ts（HTTP 層）はブラックボックス API テストで検証しており、カバレッジ集計には現れない（子プロセス起動のため）
