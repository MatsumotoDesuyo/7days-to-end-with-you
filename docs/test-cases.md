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
| ユースケーステスト (UCT) | ユーザーから見たフロー。UI 操作や API 呼び出しを通す | client: jest + react-test-renderer / server: 実サーバー + 実辞書へのブラックボックス HTTP |
| ユニットテスト (UT) | 個別機能の入出力 | jest |

いずれも CI（現在 Node 14、[node.js.yml](../.github/workflows/node.js.yml)）で実行される。

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

## 3. ユニットテスト

| ID | 対象機能 | 検証内容 | 実装 | 状態 |
|----|---------|---------|------|------|
| UT-01 | analyse-sentense (client 利用経路) | N1: 25 文字周期・Z 非到達・実例復号 / N2: Z 入力の mod 26 / N3: 26 候補 / 小文字の観測挙動 | client `common/analyse-sentense.test.ts` | 済（実装は server に一本化済み。client は再エクスポート経路を検証） |
| UT-02 | analyse-sentense (server 実装) | UT-01 と同一 | server `src/analyse-sentense.test.ts` | 済（カバレッジ 100%） |
| UT-03 | 入力正規化 (showAnalyzeText) | 先頭連続英字のみ抽出・大文字化 | client `pages/home/index.test.tsx`（コンポーネント経由） | 済（#4 の挙動変更時にユニット分離を検討） |
| UT-04 | SuggestTextList | 26 行表示・ずらし量と行の対応・空入力時は非表示 | client `components/suggest-text-list/index.test.tsx` | 済 |
| UT-05 | SuggestWordList | null/0 件/ヒットありの 3 状態の表示 | client `components/suggest-word-list/index.test.tsx` | 済 |
| UT-06 | ImageKeyboard | 全 26 ボタンが対応する大文字でコールバックを呼ぶ・BackSpace・記号画像の表示 | client `components/image-keyboard/index.test.tsx` | 済 |
| UT-07 | logger | ログが stdout へ出力されること（Factor XI の契約） | server `src/logger.test.ts` | 済 |
| UT-08 | search-word ハンドラ | SQL エラー時に 500 + 空配列で必ず応答する。成功時は候補 26 件（小文字）で照会しヒット行を返す | server `src/search-word.test.ts`（db 注入のファクトリ化により単体検証） | 済（#3） |

## 4. テスト目標

- **カバレッジは CI でゲート済み**（jest coverageThreshold、#13 で導入）:
  - コアロジック（server の analyse-sentense）: **100%**（statements/branches/functions/lines）
  - client / server とも global: statements 95 / lines 95 / functions 90 / branches 80
- テスト名には本書の ID（UCT-xx / UT-xx）を describe/test 名に併記する（#13 で付与済み）
- 運用ルール: **挙動を変更する PR は対応するテスト更新を伴う。新規ロジックはテスト同伴**。仕様変更時は use-cases.md → 本書 → テストコードの順に更新する
- 補足: server の index.ts（HTTP 層）はブラックボックス API テストで検証しており、カバレッジ集計には現れない（子プロセス起動のため）
