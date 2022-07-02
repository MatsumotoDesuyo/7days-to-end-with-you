import AnalyseSentense from './analyse-sentense';

test('文字ずらしのテスト', () => {
  expect(AnalyseSentense('a')).toEqual(expect.arrayContaining(['B', 'C']));
});
