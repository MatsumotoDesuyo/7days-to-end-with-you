/**
 * @jest-environment jsdom
 */
import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { TextField, Button } from '@mui/material';
import axios from 'axios';
import Home from './index';
import ImageKeyboard from '../../components/image-keyboard';
import SuggestTextList from '../../components/suggest-text-list';
import SuggestWordList from '../../components/suggest-word-list';

// docs/use-cases.md の UC1/UC2/UC4 と N4/N7 の画面側の証明

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function createHome(): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(<Home />);
  });
  return tree;
}

function currentInput(tree: ReactTestRenderer): string {
  return tree.root.findByType(SuggestTextList).props.inputText;
}

function typeText(tree: ReactTestRenderer, value: string): void {
  act(() => {
    tree.root.findByType(TextField).props.onChange({ target: { value } });
  });
}

describe('UC2/N7: テキスト欄への直接入力', () => {
  test('英字入力は大文字化されて候補リストに渡る', () => {
    const tree = createHome();
    typeText(tree, 'dog');
    expect(currentInput(tree)).toBe('DOG');
  });

  test('N7: 先頭から連続する英字のみ採用する (現行挙動の固定)', () => {
    const tree = createHome();
    typeText(tree, 'abc1def');
    expect(currentInput(tree)).toBe('ABC');
  });

  test('N7: 先頭が非英字なら空になる (現行挙動の固定)', () => {
    const tree = createHome();
    typeText(tree, ' dog');
    expect(currentInput(tree)).toBe('');
  });
});

describe('UC1/UC4: 記号ボタンでの入力と修正', () => {
  test('UC1: ボタン入力が連結されて候補リストに渡る', () => {
    const tree = createHome();
    const keyboard = tree.root.findByType(ImageKeyboard);
    act(() => keyboard.props.onInputButtonPushedFunc('D'));
    act(() => keyboard.props.onInputButtonPushedFunc('O'));
    act(() => keyboard.props.onInputButtonPushedFunc('G'));
    expect(currentInput(tree)).toBe('DOG');
  });

  test('UC4: BackSpace で末尾 1 文字が消える', () => {
    const tree = createHome();
    typeText(tree, 'DOG');
    const keyboard = tree.root.findByType(ImageKeyboard);
    act(() => keyboard.props.onDeleteButtonPushedFunc());
    expect(currentInput(tree)).toBe('DO');
  });
});

describe('UC3: 辞書検索', () => {
  test('検索結果が SuggestWordList に渡り、API には入力中の単語が送られる', async () => {
    const wordMeans = [{ word: 'one', mean: '一つの' }];
    mockedAxios.get.mockResolvedValue({ data: wordMeans });
    const tree = createHome();
    typeText(tree, 'RQH');

    const searchButton = tree.root
      .findAllByType(Button)
      .find((b) => b.props.children === '辞書検索');
    expect(searchButton).toBeDefined();
    await act(async () => {
      searchButton!.props.onClick();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/search-word', {
      params: { word: 'RQH' },
    });
    expect(tree.root.findByType(SuggestWordList).props.wordMeans).toEqual(
      wordMeans
    );
  });

  test('入力を変更すると辞書結果はリセットされる (現行挙動の固定)', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    const tree = createHome();
    typeText(tree, 'RQH');
    const searchButton = tree.root
      .findAllByType(Button)
      .find((b) => b.props.children === '辞書検索');
    await act(async () => {
      searchButton!.props.onClick();
    });
    expect(tree.root.findByType(SuggestWordList).props.wordMeans).toEqual([]);

    typeText(tree, 'RQHA');
    expect(tree.root.findByType(SuggestWordList).props.wordMeans).toBeNull();
  });
});

describe('N4: 表示順', () => {
  test('辞書ヒット (SuggestWordList) はシフト候補 (SuggestTextList) より上に表示される', () => {
    const tree = createHome();
    const ordered = tree.root.findAll(
      (node) => node.type === SuggestWordList || node.type === SuggestTextList
    );
    expect(ordered).toHaveLength(2);
    expect(ordered[0].type).toBe(SuggestWordList);
    expect(ordered[1].type).toBe(SuggestTextList);
  });
});
