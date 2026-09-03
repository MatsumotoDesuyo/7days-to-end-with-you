import { render } from '@testing-library/react';
import AdUnit from './index';

// docs/test-cases.md UT-12: 広告ユニット (N12 / #12)

afterEach(() => {
  delete window.adsbygoogle;
});

describe('UT-12 AdUnit', () => {
  test('本番以外では実広告をロードせず、高さだけ確保する', () => {
    const { container } = render(<AdUnit isProduction={false} />);
    expect(container.querySelector('ins.adsbygoogle')).toBeNull();
    expect(window.adsbygoogle).toBeUndefined();
    const placeholder = container.firstElementChild as HTMLElement;
    expect(placeholder.style.minHeight).toBe('100px');
  });

  test('本番では 1 ユニットを正しい属性でレンダリングし、adsbygoogle に push する', () => {
    const { container } = render(<AdUnit isProduction />);
    const ins = container.querySelector('ins.adsbygoogle') as HTMLElement;
    expect(ins).not.toBeNull();
    expect(ins.getAttribute('data-ad-client')).toBe('ca-pub-9666515152781934');
    expect(ins.getAttribute('data-ad-slot')).toBe('8476370284');
    expect(ins.getAttribute('data-ad-format')).toBe('auto');
    // レイアウトシフト防止の高さ予約
    expect(ins.style.minHeight).toBe('100px');
    // AdSense へ表示要求が 1 回だけ積まれる
    expect(window.adsbygoogle).toHaveLength(1);
  });
});
