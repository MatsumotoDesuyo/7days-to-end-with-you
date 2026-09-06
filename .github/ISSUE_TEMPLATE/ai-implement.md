---
name: AI 実装依頼
about: 受け手が AI (Opus) である前提の改修依頼。受け入れ条件は実行可能なコマンドで書く
labels: []
---

<!-- ai/implement ラベルを付けると AI (Opus) が実装を始めます。付ける前に受け入れ条件を必ず埋めてください。 -->

## 背景
<!-- なぜ必要か。関連する Issue / ADR / DEPLOYMENT.md の節 -->

## 現状 (実測)
<!-- 再現手順と現在の出力。推測ではなく実測値を貼る -->

## 変更点
<!-- 何をどう変えるか。触ってよい範囲、触ってはいけない範囲 -->

## 受け入れ条件
<!-- 本番 (merge → release 後) に対して AI (Opus) が機械的に実行する。1 行 1 条件、コマンドと期待値をセットで。
     例:
     - `curl -fsS https://7days-to-decode.soncho-works.com/api/search-word?q=apple | jq -e '.results | length > 0'` が exit 0
     - Sentry (project 7days-server, env prod) に release 後 10 分で新規 issue が 0 件
     - `container_memory_working_set_bytes{service="7days-server"}` が release 前の 1.5 倍を超えない -->
- [ ]
- [ ]

## 検証手順 (ローカル / CI)
<!-- PR の段階で実行できる確認。テスト名、lint、image-smoke など -->

## 判断が必要なこと
<!-- 仕様かバグか曖昧な点など。AI は勝手に決めず、ここに書かれた判断に従う。空なら「なし」 -->
