/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import SuggestTextList from './index';

// docs/use-cases.md N3 (全 26 シフト表示) の画面側の証明

describe('UT-04 SuggestTextList', () => {
  test('N3: 入力があるとき、ずらし量 0〜25 の全 26 行を表示する', () => {
    render(<SuggestTextList inputText="RQH" />);
    // ヘッダ行 + 26 候補行
    expect(screen.getAllByRole('row')).toHaveLength(27);
  });

  test('N1/N3: ずらし量が行の見出しに対応する (RQH の 22 ずらしは ONE)', () => {
    render(<SuggestTextList inputText="RQH" />);
    const row = screen.getByText('ONE').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('22')).toBeTruthy();
  });

  test('空入力のときは候補行を表示しない (ヘッダのみ)', () => {
    render(<SuggestTextList inputText="" />);
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});
