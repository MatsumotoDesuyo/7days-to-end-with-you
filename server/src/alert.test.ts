import * as Sentry from '@sentry/node';
import { ALERT_THROTTLE_MS, createAlerter } from './alert';

// docs/test-cases.md UT-13: p2 の通知 (#51)

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

describe('UT-13 alert (Sentry alert=p2)', () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
  });

  test('tag alert=p2 / alert.kind と固定 fingerprint を付けて送る', () => {
    const err = new Error('SQLITE_ERROR: no such table: items');
    createAlerter(() => 0)('dict-query-failed', err);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      tags: { alert: 'p2', 'alert.kind': 'dict-query-failed' },
      fingerprint: ['7days-server', 'dict-query-failed'],
    });
  });

  test('同じ kind は 1 時間に 1 件に抑制し、1 時間経てば再び送る', () => {
    let t = 1_000_000;
    const alert = createAlerter(() => t);
    alert('dict-query-failed', new Error('1'));
    t += ALERT_THROTTLE_MS - 1;
    alert('dict-query-failed', new Error('2'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    t += 1;
    alert('dict-query-failed', new Error('3'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });

  test('抑制は kind ごとに独立している', () => {
    const alert = createAlerter(() => 0);
    alert('dict-query-failed', new Error('a'));
    alert('other-kind', new Error('b'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });

  test('抑制の値は 1 時間 (#51 の計画で決めた値)', () => {
    expect(ALERT_THROTTLE_MS).toBe(60 * 60 * 1000);
  });
});
