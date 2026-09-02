import { fireEvent, render, screen } from '@testing-library/react';
import ImageKeyboard from './index';

// docs/test-cases.md UT-06: 各ボタンが正しい文字でコールバックを呼ぶ

describe('UT-06 ImageKeyboard', () => {
  test('A〜Z の全 26 ボタンが、対応する大文字でコールバックを呼ぶ', () => {
    const onInput = vi.fn();
    render(
      <ImageKeyboard
        onInputButtonPushedFunc={onInput}
        onDeleteButtonPushedFunc={vi.fn()}
      />
    );
    const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    alphabets.forEach((c) => {
      fireEvent.click(screen.getByRole('button', { name: c }));
    });
    expect(onInput.mock.calls.map((call) => call[0])).toEqual(alphabets);
  });

  test('BackSpace ボタンが削除コールバックを呼ぶ', () => {
    const onDelete = vi.fn();
    render(
      <ImageKeyboard
        onInputButtonPushedFunc={vi.fn()}
        onDeleteButtonPushedFunc={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'BackSpace' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('各ボタンにはゲーム内記号の画像が表示される', () => {
    render(
      <ImageKeyboard
        onInputButtonPushedFunc={vi.fn()}
        onDeleteButtonPushedFunc={vi.fn()}
      />
    );
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(26);
    const sources = images.map((img) => (img as HTMLImageElement).src);
    expect(sources.some((src) => src.endsWith('/images/a.png'))).toBe(true);
    expect(sources.some((src) => src.endsWith('/images/z.png'))).toBe(true);
  });
});
