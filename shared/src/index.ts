import AnalyseSentense from './analyse-sentense';

// re-export 構文 (export { default as ... } from) は CJS 出力が
// defineProperty ベースになり、Rollup の named export 静的検出に失敗する。
// 明示的な代入エクスポートにしてバンドラ互換を保つ。
export { AnalyseSentense };
export default AnalyseSentense;
