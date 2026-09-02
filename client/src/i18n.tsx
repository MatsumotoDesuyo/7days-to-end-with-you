import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// UI 文言の i18n (docs/use-cases.md UC5 / N10)。
// 文言数が少ないため外部ライブラリは使わず、依存ゼロの自前実装とする (#2)。
// 対象言語 = 辞書を提供する言語 (ja + 7 言語)。

export type Lang = 'ja' | 'en' | 'fr' | 'it' | 'de' | 'es' | 'pt' | 'zh';

export const SUPPORTED_LANGS: Lang[] = [
  'ja',
  'en',
  'fr',
  'it',
  'de',
  'es',
  'pt',
  'zh',
];

export const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文（简体）' },
];

const ja = {
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
  attributionLink: '辞書データの出典・ライセンス',
  shiftHeader: 'ずらし量',
  candidateHeader: '推測文字',
  wordHeader: '単語',
  meaningHeader: '意味',
  notFound: '候補となる単語は見つかりませんでした。',
};

export type MessageKey = keyof typeof ja;

const messages: Record<Lang, Record<MessageKey, string>> = {
  ja,
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
    attributionLink: 'Dictionary data sources & licenses',
    shiftHeader: 'Shift',
    candidateHeader: 'Guesses',
    wordHeader: 'Word',
    meaningHeader: 'Meaning',
    notFound: 'No matching words were found.',
  },
  fr: {
    pageTitle: '7 Days to End with You – Aide au décryptage',
    titleLine2: 'Aide au décryptage',
    description1:
      'Un outil simple pour décoder le chiffre de César utilisé dans 7 Days to End with You.',
    description2:
      'À utiliser quand vous voulez un petit indice sans vous faire divulgâcher les réponses.',
    inputLabel: 'Saisissez un mot ici',
    searchButton: 'Recherche dictionnaire',
    notesTitle: 'Remarques',
    notes1: 'Cet outil ne fait que décoder un chiffre de César.',
    notes2:
      'Certains mots de 7 Days to End with You ne peuvent pas être décodés par un simple chiffre de César.',
    notes3:
      'Les mots absents de la base de données du dictionnaire ne seront pas trouvés.',
    notes4:
      'Il ne peut pas tout décoder à lui seul : utilisez-le comme un compagnon de jeu.',
    aboutHandicap1:
      'En jouant, j’ai eu l’impression que le jeu vise surtout les anglophones, et que les joueurs des autres langues portent un handicap involontaire.',
    aboutHandicap2:
      'Cet outil est une tentative de supprimer ce handicap.',
    aboutHandicap3: 'Servez-vous-en bien et profitez du jeu.',
    attributionLink: 'Sources et licences des dictionnaires',
    shiftHeader: 'Décalage',
    candidateHeader: 'Hypothèses',
    wordHeader: 'Mot',
    meaningHeader: 'Sens',
    notFound: 'Aucun mot correspondant trouvé.',
  },
  it: {
    pageTitle: '7 Days to End with You – Aiuto alla decifrazione',
    titleLine2: 'Aiuto alla decifrazione',
    description1:
      'Un semplice strumento per decifrare il cifrario di Cesare usato in 7 Days to End with You.',
    description2:
      'Usalo quando vuoi un piccolo indizio senza rovinarti le risposte.',
    inputLabel: 'Scrivi qui una parola',
    searchButton: 'Ricerca nel dizionario',
    notesTitle: 'Note',
    notes1: 'Questo strumento decifra semplicemente un cifrario di Cesare.',
    notes2:
      'Alcune parole di 7 Days to End with You non possono essere decifrate con il solo cifrario di Cesare.',
    notes3:
      'Le parole assenti dal database del dizionario non verranno trovate.',
    notes4:
      'Da solo non può decifrare tutto: usalo come supporto mentre giochi.',
    aboutHandicap1:
      'Giocando ho avuto l’impressione che il gioco punti soprattutto agli anglofoni, e che chi gioca in altre lingue porti un handicap non voluto dallo sviluppatore.',
    aboutHandicap2:
      'Questo strumento è un tentativo di eliminare quell’handicap.',
    aboutHandicap3: 'Usalo bene e goditi il gioco.',
    attributionLink: 'Fonti e licenze dei dizionari',
    shiftHeader: 'Slittamento',
    candidateHeader: 'Ipotesi',
    wordHeader: 'Parola',
    meaningHeader: 'Significato',
    notFound: 'Nessuna parola corrispondente trovata.',
  },
  de: {
    pageTitle: '7 Days to End with You – Entschlüsselungshilfe',
    titleLine2: 'Entschlüsselungshilfe',
    description1:
      'Ein einfaches Werkzeug zum Entschlüsseln der Caesar-Chiffre aus 7 Days to End with You.',
    description2:
      'Nutze es, wenn du einen kleinen Hinweis möchtest, ohne dir die Lösungen zu verderben.',
    inputLabel: 'Wort hier eingeben',
    searchButton: 'Wörterbuchsuche',
    notesTitle: 'Hinweise',
    notes1: 'Dieses Werkzeug entschlüsselt lediglich eine Caesar-Chiffre.',
    notes2:
      'Einige Wörter in 7 Days to End with You lassen sich nicht allein mit einer einfachen Caesar-Chiffre entschlüsseln.',
    notes3:
      'Wörter, die nicht in der Wörterbuch-Datenbank stehen, werden nicht gefunden.',
    notes4:
      'Es kann nicht alles allein entschlüsseln – nutze es als Begleiter beim Spielen.',
    aboutHandicap1:
      'Beim Spielen hatte ich den Eindruck, dass sich das Spiel vor allem an englischsprachige Menschen richtet und Spieler anderer Sprachen einen unbeabsichtigten Nachteil haben.',
    aboutHandicap2:
      'Dieses Werkzeug ist ein Versuch, diesen Nachteil zu beseitigen.',
    aboutHandicap3: 'Nutze es gut und hab Spaß am Spiel.',
    attributionLink: 'Quellen und Lizenzen der Wörterbücher',
    shiftHeader: 'Verschiebung',
    candidateHeader: 'Vermutungen',
    wordHeader: 'Wort',
    meaningHeader: 'Bedeutung',
    notFound: 'Keine passenden Wörter gefunden.',
  },
  es: {
    pageTitle: '7 Days to End with You – Ayuda de descifrado',
    titleLine2: 'Ayuda de descifrado',
    description1:
      'Una herramienta sencilla para descifrar el cifrado César usado en 7 Days to End with You.',
    description2:
      'Úsala cuando quieras una pequeña pista sin destripar las respuestas.',
    inputLabel: 'Escribe una palabra aquí',
    searchButton: 'Buscar en el diccionario',
    notesTitle: 'Notas',
    notes1: 'Esta herramienta solo descifra un cifrado César.',
    notes2:
      'Algunas palabras de 7 Days to End with You no pueden descifrarse solo con un cifrado César simple.',
    notes3:
      'Las palabras que no estén en la base de datos del diccionario no se encontrarán.',
    notes4:
      'No puede descifrarlo todo por sí sola: úsala como apoyo mientras juegas.',
    aboutHandicap1:
      'Jugando sentí que el juego apunta sobre todo a angloparlantes, y que quienes juegan en otros idiomas cargan con una desventaja no pretendida por el desarrollador.',
    aboutHandicap2:
      'Esta herramienta es un intento de eliminar esa desventaja.',
    aboutHandicap3: 'Úsala bien y disfruta del juego.',
    attributionLink: 'Fuentes y licencias de los diccionarios',
    shiftHeader: 'Desplazamiento',
    candidateHeader: 'Conjeturas',
    wordHeader: 'Palabra',
    meaningHeader: 'Significado',
    notFound: 'No se encontraron palabras coincidentes.',
  },
  pt: {
    pageTitle: '7 Days to End with You – Ajuda de decifração',
    titleLine2: 'Ajuda de decifração',
    description1:
      'Uma ferramenta simples para decifrar a cifra de César usada em 7 Days to End with You.',
    description2:
      'Use quando quiser uma pequena dica sem estragar as respostas.',
    inputLabel: 'Digite uma palavra aqui',
    searchButton: 'Busca no dicionário',
    notesTitle: 'Notas',
    notes1: 'Esta ferramenta apenas decifra uma cifra de César.',
    notes2:
      'Algumas palavras de 7 Days to End with You não podem ser decifradas apenas com uma cifra de César simples.',
    notes3:
      'Palavras que não estão no banco de dados do dicionário não serão encontradas.',
    notes4: 'Ela não decifra tudo sozinha: use como apoio enquanto joga.',
    aboutHandicap1:
      'Jogando, senti que o jogo mira principalmente falantes de inglês, e que jogadores de outras línguas carregam uma desvantagem não intencional.',
    aboutHandicap2:
      'Esta ferramenta é uma tentativa de eliminar essa desvantagem.',
    aboutHandicap3: 'Use-a bem e aproveite o jogo.',
    attributionLink: 'Fontes e licenças dos dicionários',
    shiftHeader: 'Deslocamento',
    candidateHeader: 'Palpites',
    wordHeader: 'Palavra',
    meaningHeader: 'Significado',
    notFound: 'Nenhuma palavra correspondente encontrada.',
  },
  zh: {
    pageTitle: '7 Days to End with You 解读辅助工具',
    titleLine2: '解读辅助工具',
    description1:
      '一个用于破解《7 Days to End with You》中凯撒密码的简易工具。',
    description2: '当你不想看答案、只想要一点提示时使用。',
    inputLabel: '在此输入单词',
    searchButton: '词典检索',
    notesTitle: '注意事项',
    notes1: '本工具只是简单地破解凯撒密码。',
    notes2:
      '《7 Days to End with You》中有些单词无法仅靠简单的凯撒密码破解。',
    notes3: '词典数据库中不存在的单词无法被检索到。',
    notes4: '它无法独自破解一切，请作为游玩时的辅助使用。',
    aboutHandicap1:
      '在游玩过程中，我感到这款游戏主要面向英语玩家，其他语言的玩家背负着开发者无意造成的不利。',
    aboutHandicap2: '这个工具正是为了消除这种不利而做的尝试。',
    aboutHandicap3: '好好利用它，享受游戏吧。',
    attributionLink: '词典数据的出处与许可',
    shiftHeader: '位移量',
    candidateHeader: '推测文字',
    wordHeader: '单词',
    meaningHeader: '释义',
    notFound: '未找到候选单词。',
  },
};

const STORAGE_KEY = 'lang';

// UT-09: 保存済み選択が最優先。なければブラウザ言語 (対応言語に前方一致、なければ en)
export function resolveInitialLang(
  navigatorLanguage: string,
  stored: string | null
): Lang {
  if (stored !== null && (SUPPORTED_LANGS as string[]).includes(stored)) {
    return stored as Lang;
  }
  const lower = navigatorLanguage.toLowerCase();
  const found = SUPPORTED_LANGS.find((code) => lower.startsWith(code));
  return found ?? 'en';
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
