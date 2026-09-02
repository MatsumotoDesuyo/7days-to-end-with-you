/**
 * @jest-environment jsdom
 */
import React from 'react';
import renderer from 'react-test-renderer';
import { TableRow, TableCell, Typography } from '@mui/material';
import SuggestWordList from './index';

// docs/use-cases.md UC3 (辞書検索の表示) の証明

describe('SuggestWordList', () => {
  test('未検索 (null) のときは何も表示しない', () => {
    const tree = renderer.create(<SuggestWordList wordMeans={null} />);
    expect(tree.root.findAllByType(Typography)).toHaveLength(0);
    expect(tree.root.findAllByType(TableRow)).toHaveLength(0);
  });

  test('UC3: 0 件のときは「見つかりませんでした」と表示する', () => {
    const tree = renderer.create(<SuggestWordList wordMeans={[]} />);
    const message = tree.root.findByType(Typography);
    expect(message.props.children).toBe('候補となる単語は見つかりませんでした。');
  });

  test('UC3: ヒットした単語を意味つきで表示する', () => {
    const tree = renderer.create(
      <SuggestWordList wordMeans={[{ word: 'one', mean: '一つの' }]} />
    );
    const rows = tree.root.findAllByType(TableRow);
    expect(rows).toHaveLength(2); // ヘッダ + 1 件
    const cells = rows[1].findAllByType(TableCell);
    expect(cells[0].props.children).toBe('one');
    expect(cells[1].props.children).toBe('一つの');
  });
});
