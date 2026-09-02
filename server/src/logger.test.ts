// docs/test-cases.md UT-07: ログが stdout へ出力されること (Factor XI / #7)

describe('UT-07 logger', () => {
  test('ロガーは stdout へ出力する', () => {
    const outputs: string[] = [];
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk) => {
        outputs.push(String(chunk));
        return true;
      });
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { sysLogger, appLogger, accessLogger } = require('./logger');
        sysLogger.info('stdout-check-system');
        appLogger.info('stdout-check-application');
        accessLogger.info('stdout-check-access');
      });
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
