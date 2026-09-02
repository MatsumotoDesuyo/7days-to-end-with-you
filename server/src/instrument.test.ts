// docs/test-cases.md UT-10: Sentry 初期化の条件分岐 (#14)

vi.mock('@sentry/node', () => ({ init: vi.fn() }));

describe('UT-10 instrument (Sentry)', () => {
  const savedEnv = {
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE,
  };

  afterEach(() => {
    Object.entries(savedEnv).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  test('SENTRY_DSN 未設定なら init しない (一切送信しない)', async () => {
    vi.resetModules();
    delete process.env.SENTRY_DSN;
    await import('./instrument');
    const Sentry = await import('@sentry/node');
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  test('SENTRY_DSN 設定時は dsn/environment/release で init する', async () => {
    vi.resetModules();
    process.env.SENTRY_DSN = 'https://public@sentry.example/1';
    process.env.SENTRY_ENVIRONMENT = 'test-env';
    process.env.SENTRY_RELEASE = 'server-test123';
    await import('./instrument');
    const Sentry = await import('@sentry/node');
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'https://public@sentry.example/1',
      environment: 'test-env',
      release: 'server-test123',
      tracesSampleRate: 1.0,
    });
  });
});
