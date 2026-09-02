import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// UI 文言の i18n (docs/use-cases.md UC5 / N10)。
// 文言数が少ないため外部ライブラリは使わず、依存ゼロの自前実装とする (#2)。

export type Lang = 'ja' | 'en';

const messages = {
  ja: {
    pageTitle: '7 Days to End with You解読補助ツール',
    titleLine2: '解読補助ツール',
    description1:
      '7 Days to End with Youで使用されている、シーザー暗号を解読する簡易ツールです。',
    description2:
      '答えは見たくないけどちょっとヒントが欲しいというときにお使いください。',
    inputLabel: 'ここに単語を入力',
    searchButton: '辞書検索',
    notesTitle: '注意事項',
    notes1: 'これは単純にシーザー暗号を解読するだけのツールです。',
    notes2:
      '7 Days to End with Youでは一部単純なシーザー暗号のみでは解読できない単語が存在します。',
    notes3:
      'また、辞書のデータベースに存在しない単語は辞書検索を行っても見つかりません。',
    notes4:
      'これだけで全てが解読できるものではないので、プレイを補助する目的でご使用ください。',
    aboutHandicap1:
      '当ゲームをプレイする中で、このゲームは主に英語圏の人をターゲットにしており、日本語の話者はゲーム開発者が意図していないハンデを負うように感じました。',
    aboutHandicap2: 'これはそのハンデを無くそうという試みです。',
    aboutHandicap3: '上手く使ってゲームを楽しんでください。',
    dictLangNote: '',
    shiftHeader: 'ずらし量',
    candidateHeader: '推測文字',
    wordHeader: '単語',
    meaningHeader: '意味',
    notFound: '候補となる単語は見つかりませんでした。',
  },
  en: {
    pageTitle: '7 Days to End with You Decoding Helper',
    titleLine2: 'Decoding Helper',
    description1:
      'A simple tool for decoding the Caesar cipher used in 7 Days to End with You.',
    description2:
      'Use it when you do not want the answers spoiled but could use a little hint.',
    inputLabel: 'Type a word here',
    searchButton: 'Dictionary search',
    notesTitle: 'Notes',
    notes1: 'This tool simply decodes a Caesar cipher.',
    notes2:
      'Some words in 7 Days to End with You cannot be decoded with a simple Caesar cipher alone.',
    notes3:
      'Words that are not in the dictionary database will not be found by the dictionary search.',
    notes4:
      'It cannot decode everything by itself, so please use it as a companion while you play.',
    aboutHandicap1:
      'While playing, I felt that the game mainly targets English speakers, and that players of other languages carry a handicap the developer never intended.',
    aboutHandicap2: 'This tool is an attempt to remove that handicap.',
    aboutHandicap3: 'Use it well and enjoy the game.',
    dictLangNote:
      'Note: the built-in dictionary currently shows definitions in Japanese.',
    shiftHeader: 'Shift',
    candidateHeader: 'Guesses',
    wordHeader: 'Word',
    meaningHeader: 'Meaning',
    notFound: 'No matching words were found.',
  },
} as const;

export type MessageKey = keyof (typeof messages)['ja'];

const STORAGE_KEY = 'lang';

// UT-09: 保存済み選択が最優先。なければブラウザ言語 (ja 系→ja、他→en)
export function resolveInitialLang(
  navigatorLanguage: string,
  stored: string | null
): Lang {
  if (stored === 'ja' || stored === 'en') return stored;
  return navigatorLanguage.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey) => string;
};

// Provider なしで使われた場合 (単体テスト等) は日本語固定で動く
const I18nContext = createContext<I18nContextValue>({
  lang: 'ja',
  setLang: () => undefined,
  t: (key) => messages.ja[key],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage が使えない環境ではブラウザ言語のみで判定する
    }
    return resolveInitialLang(window.navigator.language ?? '', stored);
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できなくても表示言語の切替自体は成立させる
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = messages[lang].pageTitle;
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: (key: MessageKey) => messages[lang][key] }),
    [lang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
