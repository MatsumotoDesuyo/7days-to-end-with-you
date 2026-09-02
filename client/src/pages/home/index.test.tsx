/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import axios from 'axios';
import Home from './index';

// docs/use-cases.md の UC1/UC2/UC4 と N4/N7 の画面側の証明

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function textbox(): HTMLInputElement {
  return screen.getByRole('textbox') as HTMLInputElement;
}

function typeText(value: string): void {
  fireEvent.change(textbox(), { target: { value } });
}

describe('UCT-02 テキスト欄への直接入力 (UC2/N7)', () => {
  test('英字入力は大文字化されて反映され、候補が表示される', () => {
    render(<Home />);
    typeText('dog');
    expect(textbox().value).toBe('DOG');
    // 候補リストに DOG が現れる。25 文字周期のためずらし量 0 と 25 が
    // 同一文字列になり、ちょうど 2 行現れる (N1 の帰結)
    expect(screen.getAllByText('DOG')).toHaveLength(2);
  });

  test('N7: 先頭から連続する英字のみ採用する (現行挙動の固定)', () => {
    render(<Home />);
    typeText('abc1def');
    expect(textbox().value).toBe('ABC');
  });

  test('N7: 先頭が非英字なら空になる (現行挙動の固定)', () => {
    render(<Home />);
    // 注: 先頭スペースは type="email" の DOM 仕様で入力段階で刈り取られるため、
    // 正規化ロジックに到達する「先頭非英字」は数字等で検証する
    typeText('1dog');
    expect(textbox().value).toBe('');
  });
});

describe('UCT-01/UCT-05 記号ボタンでの入力と修正 (UC1/UC4)', () => {
  test('UC1: ボタン入力が連結されて反映される', () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'D' }));
    fireEvent.click(screen.getByRole('button', { name: 'O' }));
    fireEvent.click(screen.getByRole('button', { name: 'G' }));
    expect(textbox().value).toBe('DOG');
  });

  test('UC4: BackSpace で末尾 1 文字が消える', () => {
    render(<Home />);
    typeText('DOG');
    fireEvent.click(screen.getByRole('button', { name: 'BackSpace' }));
    expect(textbox().value).toBe('DO');
  });
});

describe('UCT-03 辞書検索 (UC3)', () => {
  test('検索結果が意味つきで表示され、API には入力中の単語が送られる', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ word: 'one', mean: '一つの' }],
    });
    render(<Home />);
    typeText('RQH');
    fireEvent.click(screen.getByRole('button', { name: '辞書検索' }));

    expect(await screen.findByText('one')).toBeTruthy();
    expect(screen.getByText('一つの')).toBeTruthy();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/search-word', {
      params: { word: 'RQH' },
    });
  });

  test('入力を変更すると辞書結果はリセットされる (現行挙動の固定)', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    render(<Home />);
    typeText('RQH');
    fireEvent.click(screen.getByRole('button', { name: '辞書検索' }));
    expect(
      await screen.findByText('候補となる単語は見つかりませんでした。')
    ).toBeTruthy();

    typeText('RQHA');
    expect(
      screen.queryByText('候補となる単語は見つかりませんでした。')
    ).toBeNull();
  });
});

describe('UCT-03 表示順 (N4)', () => {
  test('辞書ヒットの表はシフト候補の表より上に表示される', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ word: 'one', mean: '一つの' }],
    });
    render(<Home />);
    typeText('RQH');
    fireEvent.click(screen.getByRole('button', { name: '辞書検索' }));
    await screen.findByText('one');

    // DOM 順で最初の表が辞書ヒット (単語/意味)、次がシフト候補 (ずらし量)
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    expect(within(tables[0]).getByText('単語')).toBeTruthy();
    expect(within(tables[1]).getByText('ずらし量')).toBeTruthy();
  });
});
