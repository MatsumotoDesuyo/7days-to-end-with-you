// docs/test-cases.md UT-07: ログが stdout へ出力されること (Factor XI / #7)

describe('UT-07 logger', () => {
  test('ロガーは stdout へ出力する', async () => {
    const outputs: string[] = [];
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk) => {
        outputs.push(String(chunk));
        return true;
      });
    try {
      vi.resetModules();
      const { sysLogger, appLogger, accessLogger } = await import('./logger');
      sysLogger.info('stdout-check-system');
      appLogger.info('stdout-check-application');
      accessLogger.info('stdout-check-access');
    } finally {
      write.mockRestore();
    }
    const out = outputs.join('');
    // モジュール読込時の初期ログと各カテゴリの出力が stdout に届く
    expect(out).toContain('Logger awaked!');
    expect(out).toContain('stdout-check-system');
    expect(out).toContain('stdout-check-application');
    expect(out).toContain('stdout-check-access');
  });
});
