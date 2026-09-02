import AnalyseSentense from './analyse-sentense';

// docs/use-cases.md §4 の N1/N2/N3 を仕様として固定するテスト (UT-01)。
// シフト仕様の背景は docs/game-overview.md §3 を参照。

describe('UT-01 N3: 候補は常に全 26 シフト分', () => {
  test('1 文字でも複数文字でも 26 通り返す', () => {
    expect(AnalyseSentense('A')).toHaveLength(26);
    expect(AnalyseSentense('DOG')).toHaveLength(26);
  });

  test('空文字列でも 26 要素(すべて空文字)を返す', () => {
    expect(AnalyseSentense('')).toEqual(new Array(26).fill(''));
  });
});

describe('UT-01 N1: Z をスキップする 25 文字周期 (ゲーム仕様)', () => {
  test('Y の 1 ずらしは Z ではなく A になる', () => {
    expect(AnalyseSentense('Y')[1]).toBe('A');
  });

  test('Z 以外の入力はどのシフトでも Z に到達しない', () => {
    expect(AnalyseSentense('Y')).not.toContain('Z');
    expect(AnalyseSentense('A')).not.toContain('Z');
  });

  test('実ゲームの暗号単語が正しく復号できる (攻略記事の実例)', () => {
    // RQH は 22 ずらしで ONE、YCT は 20 ずらしで TWO
    expect(AnalyseSentense('RQH')[22]).toBe('ONE');
    expect(AnalyseSentense('YCT')[20]).toBe('TWO');
  });
});

describe('UT-01 N2: 入力が Z の文字だけは mod 26 (現行挙動の固定)', () => {
  test('Z のずらし 0 は Z、ずらし 1 は A', () => {
    const candidates = AnalyseSentense('Z');
    expect(candidates[0]).toBe('Z');
    expect(candidates[1]).toBe('A');
    expect(candidates).toHaveLength(26);
  });
});

describe('UT-01 現行挙動の観測 (UI が大文字化してから渡す前提)', () => {
  test('小文字はコード値がずれたまま変換される (ずらし 0 の a は H になる)', () => {
    // 'a'(97) は 97-65=32 として扱われる。呼び出し側の正規化 (N7) が前提
    expect(AnalyseSentense('a')[0]).toBe('H');
  });
});
