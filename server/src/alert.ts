import * as Sentry from '@sentry/node';
import { sysLogger } from './logger';

// #51: 新規でも初回から人の判断が要る故障を、Sentry の「アプリが宣言する P2」経路で
// #alerts へ届ける (DEPLOYMENT.md「可視性」、my-server ADR 0009 追補)。
// tag alert=p2 と kind ごとの固定 fingerprint を付けると、platform の workflow が
// その issue が新規になったときに 1 回だけ流す。送る頻度の抑制はアプリが持つ。
// kind の一覧は docs/use-cases.md (N8)。

// 1 kind につき 1 時間に 1 件。壊れたまま利用が続く間は issue が unresolved のまま
// (auto-resolve 24h に掛からない) なので再通知は連打にならず、Sentry の枠も食わない
export const ALERT_THROTTLE_MS = 60 * 60 * 1000;

export type SendAlert = (kind: string, err: unknown) => void;

// 抑制の記憶はプロセス内だけ (再起動で消えてよい。ADR 0009 追補「既知の重なり」)
export function createAlerter(now: () => number = Date.now): SendAlert {
  const lastSent = new Map<string, number>();
  return (kind, err) => {
    const last = lastSent.get(kind);
    if (last !== undefined && now() - last < ALERT_THROTTLE_MS) {
      sysLogger.warn(`alert throttled: ${kind}`);
      return;
    }
    lastSent.set(kind, now());
    Sentry.captureException(err, {
      tags: { alert: 'p2', 'alert.kind': kind },
      fingerprint: ['7days-server', kind],
    });
  };
}

export const sendAlert: SendAlert = createAlerter();
