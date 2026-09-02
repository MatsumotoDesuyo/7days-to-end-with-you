/**
 * @jest-environment jsdom
 */
import React from 'react';
import renderer from 'react-test-renderer';
import { TableRow, TableCell } from '@mui/material';
import SuggestTextList from './index';

// docs/use-cases.md N3 (全 26 シフト表示) の画面側の証明

describe('SuggestTextList', () => {
  test('N3: 入力があるとき、ずらし量 0〜25 の全 26 行を表示する', () => {
    const tree = renderer.create(<SuggestTextList inputText="RQH" />);
    const rows = tree.root.findAllByType(TableRow);
    // ヘッダ行 + 26 候補行
    expect(rows).toHaveLength(27);
  });

  test('N1/N3: ずらし量が行の見出しに対応する (RQH の 22 ずらしは ONE)', () => {
    const tree = renderer.create(<SuggestTextList inputText="RQH" />);
    const rows = tree.root.findAllByType(TableRow);
    const cells = rows[1 + 22].findAllByType(TableCell);
    expect(cells[0].props.children).toBe(22);
    expect(cells[1].props.children).toBe('ONE');
  });

  test('空入力のときは候補行を表示しない (ヘッダのみ)', () => {
    const tree = renderer.create(<SuggestTextList inputText="" />);
    expect(tree.root.findAllByType(TableRow)).toHaveLength(1);
  });
});
