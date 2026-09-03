import {
  initGa,
  trackSearch,
  trackLanguageChange,
  resetGaForTesting,
} from './ga';

// docs/test-cases.md UT-11: GA 初期化とイベント送信 (N11 / #12)

function pushedCalls(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) =>
    Array.from(entry as ArrayLike<unknown>)
  );
}

afterEach(() => {
  resetGaForTesting();
  document
    .querySelectorAll('script[src*="googletagmanager"]')
    .forEach((s) => s.remove());
  delete window.dataLayer;
  delete window.gtag;
});

describe('UT-11 GA 初期化 (N11)', () => {
  test('本番ビルド以外では何もしない (dev/CI から送信しない)', () => {
    initGa('G-TEST', false);
    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    trackSearch('ja'); // 初期化されていないので no-op
    expect(window.dataLayer).toBeUndefined();
  });

  test('測定 ID が空なら本番でも何もしない', () => {
    initGa('', true);
    expect(window.dataLayer).toBeUndefined();
  });

  test('本番では consent デフォルト → config の順で初期化しスクリプトをロードする', () => {
    initGa('G-TEST', true);
    const calls = pushedCalls();
    expect(calls[0][0]).toBe('consent');
    expect(calls[0][1]).toBe('default');
    expect(calls[0][2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    // EEA/UK/CH の地域限定拒否 (他地域はデフォルト許可)
    const consentParams = calls[0][2] as { region: string[] };
    expect(consentParams.region).toContain('DE');
    expect(consentParams.region).toContain('GB');
    expect(consentParams.region).not.toContain('JP');
    expect(calls[1][0]).toBe('js');
    expect(calls[2]).toEqual(['config', 'G-TEST']);
    const script = document.querySelector(
      'script[src*="googletagmanager"]'
    ) as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.src).toContain('id=G-TEST');
    expect(script.async).toBe(true);
  });

  test('二重初期化しない', () => {
    initGa('G-TEST', true);
    initGa('G-TEST', true);
    expect(
      document.querySelectorAll('script[src*="googletagmanager"]')
    ).toHaveLength(1);
  });
});

describe('UT-11 イベント送信 (N11)', () => {
  test('初期化後に dict_search / language_change を送信する', () => {
    initGa('G-TEST', true);
    trackSearch('fr');
    trackLanguageChange('de');
    const events = pushedCalls().filter((call) => call[0] === 'event');
    expect(events).toEqual([
      ['event', 'dict_search', { lang: 'fr' }],
      ['event', 'language_change', { lang: 'de' }],
    ]);
  });
});
