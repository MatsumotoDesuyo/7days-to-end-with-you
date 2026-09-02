import { resolveInitialLang } from './i18n';

// docs/test-cases.md UT-09: 初期言語の解決 (UC5 / N10)

describe('UT-09 resolveInitialLang', () => {
  test('保存済みの選択が最優先される', () => {
    expect(resolveInitialLang('en-US', 'ja')).toBe('ja');
    expect(resolveInitialLang('ja-JP', 'en')).toBe('en');
  });

  test('保存がなければブラウザ言語で判定する (対応言語に前方一致、なければ en)', () => {
    expect(resolveInitialLang('ja', null)).toBe('ja');
    expect(resolveInitialLang('ja-JP', null)).toBe('ja');
    expect(resolveInitialLang('en-US', null)).toBe('en');
    expect(resolveInitialLang('fr-FR', null)).toBe('fr');
    expect(resolveInitialLang('it-IT', null)).toBe('it');
    expect(resolveInitialLang('de-DE', null)).toBe('de');
    expect(resolveInitialLang('es-419', null)).toBe('es');
    expect(resolveInitialLang('pt-BR', null)).toBe('pt');
    expect(resolveInitialLang('zh-CN', null)).toBe('zh');
    expect(resolveInitialLang('ko-KR', null)).toBe('en');
    expect(resolveInitialLang('', null)).toBe('en');
  });

  test('不正な保存値は無視してブラウザ言語で判定する', () => {
    expect(resolveInitialLang('ja-JP', 'xx')).toBe('ja');
    expect(resolveInitialLang('en-US', 'unknown')).toBe('en');
  });
});
