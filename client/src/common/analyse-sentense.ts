function toAlphabet(orgNum: number, moveNum: number): string {
  let num = orgNum + moveNum;
  if (orgNum === 25) {
    num %= 26;
    return String.fromCharCode(num + 65);
  }
  while (num >= 25) {
    num -= 25;
  }
  return String.fromCharCode(num + 65);
}

function buildSentence(arr: number[], move: number): string {
  let str = '';
  arr.forEach((ar) => {
    str += toAlphabet(ar, move);
  });
  return str;
}

export default function AnalyseSentense(str: string): string[] {
  const result: string[] = [];
  const numArr: number[] = [];
  for (let i = 0; i < str.length; i++) {
    numArr.push(str[i].charCodeAt(0) - 65);
  }
  //数値を一定ずらして変換
  for (let i = 0; i < 26; i++) {
    result.push(buildSentence(numArr, i));
  }
  return result;
}
