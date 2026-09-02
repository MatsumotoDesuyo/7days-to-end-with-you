import { resolveInitialLang } from './i18n';

// docs/test-cases.md UT-09: 初期言語の解決 (UC5 / N10)

describe('UT-09 resolveInitialLang', () => {
  test('保存済みの選択が最優先される', () => {
    expect(resolveInitialLang('en-US', 'ja')).toBe('ja');
    expect(resolveInitialLang('ja-JP', 'en')).toBe('en');
  });

  test('保存がなければブラウザ言語で判定する (ja 系→ja、他→en)', () => {
    expect(resolveInitialLang('ja', null)).toBe('ja');
    expect(resolveInitialLang('ja-JP', null)).toBe('ja');
    expect(resolveInitialLang('en-US', null)).toBe('en');
    expect(resolveInitialLang('fr-FR', null)).toBe('en');
    expect(resolveInitialLang('', null)).toBe('en');
  });

  test('不正な保存値は無視してブラウザ言語で判定する', () => {
    expect(resolveInitialLang('ja-JP', 'de')).toBe('ja');
    expect(resolveInitialLang('en-US', 'unknown')).toBe('en');
  });
});
