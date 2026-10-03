#!/usr/bin/env node
// lock に新しく入る版が、公開から renovate.json の minimumReleaseAge 以上かを確かめる (#49)。
//
// なぜ: Renovate は lockfile を作るとき npm install --before=<今 - minimumReleaseAge> で推移的な依存にも待ちを効かせるが、
// ETARGET になると --before を外してやり直し、PR にコメント (Artifact update notice) を書くだけで自動 merge は止まらない。
// 待ち (my-server ops/ai/renovate-automerge.md「待ち」、dependency-trust.md「版の選び方」) を lock の実物で機械的に守る。
//
// 比べるもの: <base>:package-lock.json と <head>:package-lock.json (既定は HEAD^1 と HEAD)。
//   PR の run の HEAD は GitHub が作る merge の commit で、1 つ目の親が base の main。main への push の run も 1 つ目の親が直前の main。
// 新しい版 = head の (名前@版) の集合 - base の集合。hoist で key が動いただけの項目は数えない。
// 公開時刻: registry の packument の time[版] (Renovate の npm datasource の releaseTimestamp と同じ値)。
// 合格: 今 - 公開時刻 >= minimumReleaseAge (Renovate の stability の判定、--before と同じ物差し)。
//   minimumReleaseAge は base と head の renovate.json の長い方を使う (PR の中で閾値を縮めても、その PR の判定は緩まない)。
// 赤にするもの: 待ちに満たない版、公開時刻を引けない版 (registry に届かない・time が無い・全体の上限の時間を過ぎた)、
//   resolved が その名前@版の registry の tarball (https://registry.npmjs.org/<名前>/-/<名前の最後>-<版>.tgz) でない項目、
//   minimumReleaseAge を読めないとき。
// 見ないもの: 同じ名前@版のまま resolved・integrity だけが変わる行 (新しく入る名前@版ではないので数えない。lock の差分のレビューが受け持つ)。
// 脆弱性の修正の除外 (Renovate の既定の vulnerabilityAlerts と同じ範囲を同じ印で見分ける。minimumReleaseAge: null、
//   branch は <datasource>-<名前>-vulnerability、commit の後ろに [SECURITY]):
//   PR の run は head の branch が -vulnerability で終わるとき、それ以外の run は HEAD の commit のメッセージで見分ける。
//   除外のときも確かめは飛ばさず、版と公開からの日数と exempt をログに出す (待ちに満たない版だけを合格に変える)。
//
// 使い方: node scripts/release-age.mjs                     (CI。HEAD^1 と HEAD を比べる。EVENT_NAME と HEAD_REF を env で受ける)
//         node scripts/release-age.mjs --diff <base> <head> (任意の 2 つの rev を比べる)
//         node scripts/release-age.mjs --all                (head の lock の全部の版を確かめる)
// 依存: Node の標準だけ (fetch、child_process、fs)。
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const REGISTRY = 'https://registry.npmjs.org';
const LOCK = 'package-lock.json';
const CONCURRENCY = 8;
const TIMEOUT_MS = 10_000; // 1 回の問い合わせ
const OVERALL_LIMIT_MS = 5 * 60_000; // 問い合わせ全体 (job の timeout-minutes より短く、どの名前が届かなかったかをログに残すため)
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const DAY_MS = 24 * 60 * 60 * 1000;

// "7 days" / "1 day" を ms に。それ以外の書式は null (読めない = 赤)
export function parseMinimumReleaseAge(value) {
  if (typeof value !== 'string') return null;
  const m = /^\s*(\d+)\s*days?\s*$/.exec(value);
  return m ? Number(m[1]) * DAY_MS : null;
}

// renovate.json の minimumReleaseAge。packageRules にもあれば、いちばん長いもの (厳しい側) を使う
export function minimumReleaseAgeFrom(config) {
  const values = [];
  if (config && 'minimumReleaseAge' in config) values.push(config.minimumReleaseAge);
  for (const rule of config?.packageRules ?? []) {
    if (rule && 'minimumReleaseAge' in rule) values.push(rule.minimumReleaseAge);
  }
  if (values.length === 0) return { ms: null, problem: 'renovate.json に minimumReleaseAge が無い' };
  let max = 0;
  for (const v of values) {
    const ms = parseMinimumReleaseAge(v);
    if (ms === null) return { ms: null, problem: `minimumReleaseAge を読めない: ${JSON.stringify(v)}` };
    max = Math.max(max, ms);
  }
  return { ms: max, problem: null };
}

// 複数の renovate.json (base と head) の長い方。どれか 1 つでも読めなければ赤
export function combinedMinimumReleaseAge(configs) {
  let max = null;
  for (const { label, config } of configs) {
    if (config === null || typeof config !== 'object') return { ms: null, problem: `${label} を読めない (無いか JSON でない)` };
    const { ms, problem } = minimumReleaseAgeFrom(config);
    if (ms === null) return { ms: null, problem: `${label}: ${problem}` };
    max = max === null ? ms : Math.max(max, ms);
  }
  return max === null ? { ms: null, problem: 'renovate.json を 1 つも読めない' } : { ms: max, problem: null };
}

// lock の key (node_modules/a/node_modules/@s/b) から名前を取る。npm の別名は項目の name を使う
export function packageNameOf(key, entry) {
  if (entry && typeof entry.name === 'string' && entry.name) return entry.name;
  const marker = 'node_modules/';
  return key.slice(key.lastIndexOf(marker) + marker.length);
}

// lock から (名前@版) -> { name, version, resolved }。workspace の項目と link は除く
export function versionsOf(lock) {
  if (!lock || typeof lock.packages !== 'object' || lock.packages === null) {
    throw new Error('lock に packages が無い (lockfileVersion 2 以上が要る)');
  }
  const map = new Map();
  for (const [key, entry] of Object.entries(lock.packages)) {
    if (!key.includes('node_modules/')) continue;
    if (!entry || entry.link) continue;
    const name = packageNameOf(key, entry);
    const version = entry.version;
    const id = `${name}@${version}`;
    if (!map.has(id)) map.set(id, { name, version, resolved: entry.resolved });
  }
  return map;
}

// head にあって base に無い (名前@版)。名前@版の順に並べる
export function newVersions(baseLock, headLock) {
  const base = baseLock ? versionsOf(baseLock) : new Map();
  const head = versionsOf(headLock);
  return [...head.entries()]
    .filter(([id]) => !base.has(id))
    .map(([, v]) => v)
    .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
}

// 脆弱性の修正の印。PR の run は branch の名前だけを見る (PR の題は後から変えられ、run が回り直さないため)
export function exemptionReason({ eventName, headRef, commitMessage }) {
  if (eventName === 'pull_request') {
    return typeof headRef === 'string' && /-vulnerability$/.test(headRef)
      ? `脆弱性の修正の branch (${headRef})`
      : null;
  }
  const msg = typeof commitMessage === 'string' ? commitMessage : '';
  const merged = /^Merge pull request #\d+ from \S+-vulnerability\s*$/m.exec(msg);
  if (merged) return `脆弱性の修正の branch の merge (${merged[0].trim()})`;
  if (msg.includes('[SECURITY]')) return '脆弱性の修正の commit ([SECURITY])';
  return null;
}

// resolved が、その名前@版の registry の tarball そのものか (取得先が違う、名前@版と中身が食い違う、は赤)
export function expectedTarball(name, version) {
  return `${REGISTRY}/${name}/-/${name.split('/').pop()}-${version}.tgz`;
}

export function registryProblem(resolved, name, version) {
  if (typeof resolved !== 'string' || !resolved.startsWith(`${REGISTRY}/`)) {
    return `取得先が ${REGISTRY} でない (resolved: ${resolved ?? '(なし)'})`;
  }
  if (resolved !== expectedTarball(name, version)) {
    return `resolved が ${name}@${version} の tarball と合わない (resolved: ${resolved}、期待: ${expectedTarball(name, version)})`;
  }
  return null;
}

export function isOldEnough(publishedMs, nowMs, minAgeMs) {
  return nowMs - publishedMs >= minAgeMs;
}

// 版ごとの判定。timesByName: 名前 -> { time } か { error }
export function evaluate({ versions, timesByName, nowMs, minAgeMs, exemption }) {
  const rows = [];
  for (const v of versions) {
    const id = `${v.name}@${v.version}`;
    const problem = v.version ? registryProblem(v.resolved, v.name, v.version) : '版が書かれていない';
    if (problem) {
      rows.push({ id, status: 'ERROR', detail: problem });
      continue;
    }
    const got = timesByName.get(v.name);
    if (!got || got.error) {
      rows.push({ id, status: 'ERROR', detail: `registry に届かない: ${got?.error ?? '(問い合わせていない)'}` });
      continue;
    }
    const iso = got.time?.[v.version];
    const publishedMs = typeof iso === 'string' ? Date.parse(iso) : NaN;
    if (Number.isNaN(publishedMs)) {
      rows.push({ id, status: 'ERROR', detail: `公開時刻 (time[${v.version}]) が無い` });
      continue;
    }
    const ageDays = (nowMs - publishedMs) / DAY_MS;
    const detail = `published ${iso} age ${ageDays.toFixed(2)}d`;
    if (isOldEnough(publishedMs, nowMs, minAgeMs)) {
      rows.push({ id, status: 'OK', detail, publishedMs });
    } else if (exemption) {
      rows.push({ id, status: 'EXEMPT', detail: `${detail} (待ちに満たないが、${exemption})`, publishedMs });
    } else {
      rows.push({ id, status: 'YOUNG', detail, publishedMs });
    }
  }
  const failed = rows.filter((r) => r.status === 'ERROR' || r.status === 'YOUNG');
  return { rows, ok: failed.length === 0, failed };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function packumentUrl(registry, name) {
  const path = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);
  return `${registry}/${path}`;
}

async function fetchTime(registry, name, deadline) {
  let lastError = '';
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (Date.now() >= deadline) return { error: `全体の上限 (${OVERALL_LIMIT_MS / 1000} 秒) を過ぎた。最後のエラー: ${lastError || '(なし)'}` };
    try {
      const res = await fetch(packumentUrl(registry, name), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = await res.json();
      return { time: doc.time ?? {} };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  return { error: lastError };
}

async function fetchTimes(registry, names) {
  const out = new Map();
  const queue = [...names];
  const deadline = Date.now() + OVERALL_LIMIT_MS;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const name = queue.shift();
      out.set(name, await fetchTime(registry, name, deadline));
    }
  });
  await Promise.all(workers);
  return out;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

// rev の lock を読む。rev はあるが lock が無いときは null (全部が新しい版)。rev が無いときは例外 (赤)
function lockAt(rev) {
  const sha = git(['rev-parse', '--verify', `${rev}^{commit}`]).trim();
  try {
    git(['cat-file', '-e', `${sha}:${LOCK}`]);
  } catch {
    return { sha, lock: null };
  }
  return { sha, lock: JSON.parse(git(['show', `${sha}:${LOCK}`])) };
}

// rev の renovate.json。無い・JSON でないときは null (読めない = 赤)
function configAt(sha) {
  try {
    return JSON.parse(git(['show', `${sha}:renovate.json`]));
  } catch {
    return null;
  }
}

function summary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

async function main(argv) {
  let baseRev = 'HEAD^1';
  let headRev = 'HEAD';
  let all = false;
  if (argv[0] === '--all') {
    all = true;
  } else if (argv[0] === '--diff' && argv.length === 3) {
    [baseRev, headRev] = [argv[1], argv[2]];
  } else if (argv.length > 0) {
    console.log('usage: node scripts/release-age.mjs [--all | --diff <base> <head>]');
    return 2;
  }

  const head = lockAt(headRev);
  if (!head.lock) {
    console.log(`NG: ${headRev} に ${LOCK} が無い`);
    return 1;
  }
  const base = all ? { sha: '(なし: --all)', lock: null } : lockAt(baseRev);

  // 閾値は base と head の renovate.json の長い方 (--all は head だけ)。読めなければ赤
  const configs = [{ label: `head (${head.sha.slice(0, 7)}) の renovate.json`, config: configAt(head.sha) }];
  if (!all) configs.push({ label: `base (${base.sha.slice(0, 7)}) の renovate.json`, config: configAt(base.sha) });
  const { ms: minAgeMs, problem } = combinedMinimumReleaseAge(configs);
  if (minAgeMs === null) {
    console.log(`NG: ${problem}`);
    return 1;
  }
  const versions = newVersions(base.lock, head.lock);

  const eventName = process.env.EVENT_NAME ?? '';
  const headRef = process.env.HEAD_REF ?? '';
  const commitMessage = git(['log', '-1', '--format=%B', head.sha]);
  const exemption = exemptionReason({ eventName, headRef, commitMessage });

  console.log(`minimumReleaseAge: ${minAgeMs / DAY_MS} days`);
  console.log(`base: ${base.sha}`);
  console.log(`head: ${head.sha}`);
  console.log(`event: ${eventName || '(なし)'} head_ref: ${headRef || '(なし)'}`);
  console.log(`exempt: ${exemption ?? 'no'}`);
  console.log(`new versions in ${LOCK}: ${versions.length}`);
  if (versions.length === 0) {
    console.log('OK: lock に新しく入る版は無い');
    summary(['### release-age', '', 'lock に新しく入る版は無い']);
    return 0;
  }

  const names = [...new Set(versions.filter((v) => !registryProblem(v.resolved, v.name, v.version)).map((v) => v.name))];
  const timesByName = await fetchTimes(REGISTRY, names);
  const nowMs = Date.now();
  const { rows, ok, failed } = evaluate({ versions, timesByName, nowMs, minAgeMs, exemption });

  const sorted = [...rows].sort((a, b) => (b.publishedMs ?? Infinity) - (a.publishedMs ?? Infinity));
  for (const r of sorted) console.log(`${r.status.padEnd(6)} ${r.id}  ${r.detail}`);
  const unreachable = [...timesByName.entries()].filter(([, t]) => t.error).map(([n]) => n);
  if (unreachable.length > 0) console.log(`registry に届かなかった名前 (${unreachable.length}): ${unreachable.join(', ')}`);
  const counts = ['OK', 'EXEMPT', 'YOUNG', 'ERROR'].map((s) => `${s} ${rows.filter((r) => r.status === s).length}`);
  console.log(`total ${rows.length}: ${counts.join(', ')}`);
  summary([
    '### release-age',
    '',
    `minimumReleaseAge ${minAgeMs / DAY_MS} days、exempt: ${exemption ?? 'no'}、${counts.join('、')}`,
    '',
    '| status | version | detail |',
    '|---|---|---|',
    ...sorted.map((r) => `| ${r.status} | \`${r.id}\` | ${r.detail.replace(/\|/g, '\\|')} |`),
  ]);
  if (!ok) {
    console.log(`NG: ${failed.length} 件が待ち (${minAgeMs / DAY_MS} 日) を満たさないか、判定できない`);
    return 1;
  }
  console.log(exemption ? `OK (exempt: ${exemption})` : 'OK: すべて待ちを満たす');
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.log(`NG: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    },
  );
}
