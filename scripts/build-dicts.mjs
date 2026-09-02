// 多言語辞書の生成スクリプト (issue #2 第 2 段)
//
// Open Multilingual Wordnet 1.4 + OdeNet 1.4 (WN-LMF XML) を ILI で結合し、
// 既存 ejdict と同じ items(word, mean) スキーマの SQLite を言語別に生成する。
//   - en: 英語見出し語 → 英語語義 (英英)
//   - それ以外: 英語見出し語 → 対象言語の訳語 + 英語語義
// 各 SQLite には attribution テーブル (出典・ライセンス) を埋め込む。
// LICENSE ファイルは client/public/licenses/ へコピーし、attributions.html から参照する。
//
// 実行 (リポジトリルート、要 npm ci 済み):
//   node scripts/build-dicts.mjs
// 環境変数: DICT_CACHE=ダウンロードキャッシュ dir (default: .cache/dicts)

import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import { mkdir, copyFile, rm, access, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = process.env.DICT_CACHE || path.join(ROOT, '.cache', 'dicts');
const OUT_DIR = path.join(ROOT, 'server', 'dict');
const LICENSE_OUT = path.join(ROOT, 'client', 'public', 'licenses');

const SOURCES = {
  omw: {
    url: 'https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz',
    archive: 'omw-1.4.tar.xz',
    dir: 'omw-1.4',
  },
  odenet: {
    url: 'https://github.com/hdaSprachtechnologie/odenet/releases/download/v1.4/odenet-1.4.tar.xz',
    archive: 'odenet-1.4.tar.xz',
    dir: 'odenet-1.4',
  },
};

// UI 言語コード → LMF ファイルの場所 (en は語義ソースとして常に読む)
const TARGETS = [
  { code: 'fr', source: 'omw', sub: 'omw-fr/omw-fr.xml', license: 'omw-fr/LICENSE' },
  { code: 'it', source: 'omw', sub: 'omw-it/omw-it.xml', license: 'omw-it/LICENSE' },
  { code: 'es', source: 'omw', sub: 'omw-es/omw-es.xml', license: 'omw-es/LICENSE' },
  { code: 'pt', source: 'omw', sub: 'omw-pt/omw-pt.xml', license: 'omw-pt/LICENSE' },
  { code: 'zh', source: 'omw', sub: 'omw-cmn/omw-cmn.xml', license: 'omw-cmn/LICENSE' },
  { code: 'de', source: 'odenet', sub: null, license: null }, // 展開後に .xml / LICENSE を探索
];

const MAX_SENSES_PER_WORD = 8;

// ゲーム頻出級の基礎語彙。生成後のカバレッジ検証に使う
const BASIC_WORDS = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'day', 'night',
  'you', 'dog', 'cat', 'house', 'water', 'fire', 'love', 'hand', 'eye',
  'morning', 'food', 'death', 'life', 'book', 'door', 'key', 'man', 'woman',
  'child', 'name', 'word', 'time', 'end', 'flower', 'memory', 'room',
];

function decodeXml(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  if (await exists(dest)) return;
  console.log(`download: ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function ensureSources() {
  await mkdir(CACHE, { recursive: true });
  for (const src of Object.values(SOURCES)) {
    const archive = path.join(CACHE, src.archive);
    await download(src.url, archive);
    const dir = path.join(CACHE, src.dir);
    if (!(await exists(dir))) {
      console.log(`extract: ${src.archive}`);
      execFileSync('tar', ['xJf', archive, '-C', CACHE]);
    }
  }
}

// WN-LMF XML を行指向でパースする。
// omw/odenet の LMF は機械生成の整形済み XML だが、タグが複数行に割れる
// 可能性に備えて「タグが閉じるまで行を連結する」バッファを使う。
async function parseLmf(file) {
  const entries = []; // { lemma, synsets: [localSynsetId] }
  const synsetIli = new Map(); // localSynsetId -> ili
  const iliGloss = new Map(); // ili -> first definition
  let current = null; // 処理中の LexicalEntry
  let currentSynsetIli = null;
  let buffer = null; // 未閉のタグ行

  const rl = createInterface({
    input: createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const handle = (line) => {
    if (line.includes('<LexicalEntry')) {
      current = { lemma: null, synsets: [] };
      return;
    }
    if (line.includes('</LexicalEntry>')) {
      if (current && current.lemma !== null && current.synsets.length > 0) {
        entries.push(current);
      }
      current = null;
      return;
    }
    if (current && line.includes('<Lemma')) {
      const m = line.match(/writtenForm="([^"]*)"/);
      if (m) current.lemma = decodeXml(m[1]);
      return;
    }
    if (current && line.includes('<Sense')) {
      const m = line.match(/\bsynset="([^"]+)"/);
      if (m) current.synsets.push(m[1]);
      return;
    }
    if (line.includes('<Synset')) {
      const id = line.match(/\bid="([^"]+)"/);
      const ili = line.match(/\bili="([^"]+)"/);
      currentSynsetIli = null;
      if (id && ili && ili[1] !== '') {
        synsetIli.set(id[1], ili[1]);
        currentSynsetIli = ili[1];
      }
      return;
    }
    if (currentSynsetIli && line.includes('<Definition')) {
      const m = line.match(/<Definition[^>]*>([\s\S]*?)<\/Definition>/);
      if (m && !iliGloss.has(currentSynsetIli)) {
        iliGloss.set(currentSynsetIli, decodeXml(m[1]).trim());
      }
      return;
    }
  };

  for await (const rawLine of rl) {
    let line = rawLine;
    if (buffer !== null) {
      line = `${buffer} ${rawLine.trim()}`;
    }
    // 開きタグがあるのに '>' が無い行は次行と連結する
    const lastOpen = line.lastIndexOf('<');
    if (lastOpen >= 0 && line.indexOf('>', lastOpen) < 0) {
      buffer = line;
      continue;
    }
    buffer = null;
    handle(line);
  }
  return { entries, synsetIli, iliGloss };
}

// Lexicon タグから出典メタデータを取る
async function parseLexiconMeta(file) {
  const rl = createInterface({
    input: createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let buf = '';
  for await (const line of rl) {
    buf += `${line}\n`;
    if (line.includes('>') && buf.includes('<Lexicon')) break;
    if (buf.length > 20000) break;
  }
  const attr = (name) => {
    const m = buf.match(new RegExp(`${name}="([^"]*)"`));
    return m ? decodeXml(m[1]) : '';
  };
  return {
    label: attr('label'),
    license: attr('license'),
    url: attr('url'),
    citation: attr('citation'),
  };
}

function buildWordSenses(enParsed) {
  // 英語見出し語 (小文字・空白なし) → ili の配列 (sense 順 = 頻度順)
  const map = new Map();
  for (const entry of enParsed.entries) {
    const word = entry.lemma.toLowerCase();
    if (/\s/.test(word)) continue; // 複数語は候補文字列にヒットし得ないため除外
    let ilis = map.get(word);
    if (!ilis) {
      ilis = [];
      map.set(word, ilis);
    }
    for (const localId of entry.synsets) {
      const ili = enParsed.synsetIli.get(localId);
      if (ili && !ilis.includes(ili)) ilis.push(ili);
    }
  }
  return map;
}

function buildIliToLemmas(parsed) {
  const map = new Map(); // ili -> [lemma]
  for (const entry of parsed.entries) {
    for (const localId of entry.synsets) {
      const ili = parsed.synsetIli.get(localId);
      if (!ili) continue;
      let lemmas = map.get(ili);
      if (!lemmas) {
        lemmas = [];
        map.set(ili, lemmas);
      }
      if (!lemmas.includes(entry.lemma)) lemmas.push(entry.lemma);
    }
  }
  return map;
}

function writeSqlite(file, rows, attribution) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(file);
    db.serialize(() => {
      db.run('PRAGMA journal_mode = OFF');
      db.run('CREATE TABLE items (word TEXT, mean TEXT)');
      db.run(
        'CREATE TABLE attribution (source TEXT, license TEXT, url TEXT, citation TEXT, note TEXT)'
      );
      db.run('BEGIN');
      const stmt = db.prepare('INSERT INTO items (word, mean) VALUES (?, ?)');
      for (const [word, mean] of rows) stmt.run(word, mean);
      stmt.finalize();
      const astmt = db.prepare(
        'INSERT INTO attribution (source, license, url, citation, note) VALUES (?, ?, ?, ?, ?)'
      );
      for (const a of attribution) {
        astmt.run(a.source, a.license, a.url, a.citation, a.note);
      }
      astmt.finalize();
      db.run('COMMIT');
      db.run('CREATE INDEX idx_items_word ON items (word)');
    });
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

function reportCoverage(code, rows) {
  const words = new Set(rows.map(([w]) => w));
  const hit = BASIC_WORDS.filter((w) => words.has(w));
  console.log(
    `${code}: rows=${rows.length} basic-words=${hit.length}/${BASIC_WORDS.length}` +
      (hit.length < BASIC_WORDS.length
        ? ` missing=[${BASIC_WORDS.filter((w) => !words.has(w)).join(', ')}]`
        : '')
  );
}

async function findOdenetFiles() {
  const dir = path.join(CACHE, SOURCES.odenet.dir);
  const list = execFileSync('find', [dir, '-name', '*.xml'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  if (list.length === 0) throw new Error('odenet xml not found');
  const licenses = execFileSync('find', [dir, '-iname', 'LICENSE*'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  return { xml: list[0], license: licenses[0] ?? null };
}

async function main() {
  await ensureSources();
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(LICENSE_OUT, { recursive: true });

  const enXml = path.join(CACHE, SOURCES.omw.dir, 'omw-en/omw-en.xml');
  console.log('parse: omw-en (glosses)');
  const enParsed = await parseLmf(enXml);
  const enMeta = await parseLexiconMeta(enXml);
  const wordSenses = buildWordSenses(enParsed);
  console.log(
    `omw-en: words=${wordSenses.size} synsets=${enParsed.synsetIli.size} glosses=${enParsed.iliGloss.size}`
  );

  const enLicenseSrc = path.join(CACHE, SOURCES.omw.dir, 'omw-en/LICENSE');
  await copyFile(enLicenseSrc, path.join(LICENSE_OUT, 'en.txt'));

  // en (英英): 語義のみ
  const enRows = [];
  for (const [word, ilis] of wordSenses) {
    const senses = [];
    for (const ili of ilis) {
      const gloss = enParsed.iliGloss.get(ili);
      if (gloss) senses.push(gloss);
      if (senses.length >= MAX_SENSES_PER_WORD) break;
    }
    if (senses.length > 0) enRows.push([word, senses.join(' / ')]);
  }
  reportCoverage('en', enRows);
  await writeSqlite(path.join(OUT_DIR, 'en.sqlite3'), enRows, [
    {
      source: enMeta.label,
      license: enMeta.license,
      url: 'https://github.com/omwn/omw-data',
      citation: enMeta.citation,
      note: 'License text: /licenses/en.txt',
    },
  ]);

  for (const target of TARGETS) {
    let xml;
    let licenseSrc;
    if (target.source === 'odenet') {
      const found = await findOdenetFiles();
      xml = found.xml;
      licenseSrc = found.license;
    } else {
      xml = path.join(CACHE, SOURCES.omw.dir, target.sub);
      licenseSrc = path.join(CACHE, SOURCES.omw.dir, target.license);
    }
    console.log(`parse: ${target.code}`);
    const parsed = await parseLmf(xml);
    const meta = await parseLexiconMeta(xml);
    const iliToLemmas = buildIliToLemmas(parsed);

    const rows = [];
    for (const [word, ilis] of wordSenses) {
      const senses = [];
      for (const ili of ilis) {
        const lemmas = iliToLemmas.get(ili);
        if (!lemmas || lemmas.length === 0) continue;
        const gloss = enParsed.iliGloss.get(ili);
        senses.push(gloss ? `${lemmas.join(', ')} — ${gloss}` : lemmas.join(', '));
        if (senses.length >= MAX_SENSES_PER_WORD) break;
      }
      if (senses.length > 0) rows.push([word, senses.join(' / ')]);
    }
    reportCoverage(target.code, rows);

    if (licenseSrc) {
      await copyFile(licenseSrc, path.join(LICENSE_OUT, `${target.code}.txt`));
    }
    await writeSqlite(path.join(OUT_DIR, `${target.code}.sqlite3`), rows, [
      {
        source: meta.label,
        license: meta.license,
        url: meta.url || 'https://github.com/omwn/omw-data',
        citation: meta.citation,
        note: `License text: /licenses/${target.code}.txt`,
      },
      {
        source: enMeta.label,
        license: enMeta.license,
        url: 'https://github.com/omwn/omw-data',
        citation: enMeta.citation,
        note: 'English glosses. License text: /licenses/en.txt',
      },
    ]);
  }
  console.log('done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
