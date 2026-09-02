/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import SuggestWordList from './index';

// docs/use-cases.md UC3 (辞書検索の表示) の証明

describe('UT-05 SuggestWordList', () => {
  test('未検索 (null) のときは何も表示しない', () => {
    render(<SuggestWordList wordMeans={null} />);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(screen.queryByText(/見つかりませんでした/)).toBeNull();
  });

  test('UC3: 0 件のときは「見つかりませんでした」と表示する', () => {
    render(<SuggestWordList wordMeans={[]} />);
    expect(
      screen.getByText('候補となる単語は見つかりませんでした。')
    ).toBeTruthy();
  });

  test('UC3: ヒットした単語を意味つきで表示する', () => {
    render(<SuggestWordList wordMeans={[{ word: 'one', mean: '一つの' }]} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2); // ヘッダ + 1 件
    expect(within(rows[1]).getByText('one')).toBeTruthy();
    expect(within(rows[1]).getByText('一つの')).toBeTruthy();
  });
});
