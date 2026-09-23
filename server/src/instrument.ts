import * as Sentry from '@sentry/node';

// #14: errors を共有 observability プレーン (Sentry) へ emit する。
// SDK 組み込みはアプリの emit 義務 (ADR 0007 / DEPLOYMENT.md「可視性」)。
// DSN 等は platform が実行時に注入する (issue #14 の契約):
//   SENTRY_DSN / SENTRY_ENVIRONMENT / SENTRY_RELEASE (regression 追跡のキー)
// SENTRY_DSN 未設定時 (ローカル開発・CI) は初期化せず、一切送信しない。
// #52: health の probe (platform の blackbox は 60 秒ごと ≒ 1,440 件/日) を traces に
// 載せない。実際の利用 (検索 約 2 件/日) が probe に埋もれ、org 共有の枠も食うため。
// url.path はクエリを除いたパス (@sentry/node 10 の http.server span で実測)
export const tracesSampler = (context: {
  attributes?: Record<string, unknown>;
}): number => (context.attributes?.['url.path'] === '/api/health' ? 0 : 1.0);

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
    // ADR 0010: アプリの信号 (リクエスト数・応答時間・エラー率・traces) も
    // Sentry SDK の tracing で emit する。低トラフィックのため全量送信
    // (Sentry の quota が問題になったら下げる)。/api/health だけは送らない
    tracesSampler,
  });
}
