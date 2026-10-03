// scripts/release-age.mjs の純粋な部分の self-test (#49)。registry には届かない。
// 実行: node --test scripts/release-age.test.mjs (CI の job release-age が毎回動かす)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REGISTRY,
  evaluate,
  exemptionReason,
  isOldEnough,
  minimumReleaseAgeFrom,
  newVersions,
  packageNameOf,
  parseMinimumReleaseAge,
  registryProblem,
  versionsOf,
} from './release-age.mjs';

const DAY = 24 * 60 * 60 * 1000;
const tgz = (name, version) => `${REGISTRY}/${name}/-/${name.split('/').pop()}-${version}.tgz`;
const entry = (name, version, extra = {}) => ({ version, resolved: tgz(name, version), ...extra });

test('minimumReleaseAge の読み方 (Renovate の "7 days" と同じ値)', () => {
  assert.equal(parseMinimumReleaseAge('7 days'), 7 * DAY);
  assert.equal(parseMinimumReleaseAge('1 day'), DAY);
  assert.equal(parseMinimumReleaseAge('3 hours'), null);
  assert.equal(parseMinimumReleaseAge(undefined), null);
  assert.deepEqual(minimumReleaseAgeFrom({ minimumReleaseAge: '7 days' }), { ms: 7 * DAY, problem: null });
  // packageRules にもあれば、いちばん長いもの (厳しい側)
  assert.equal(
    minimumReleaseAgeFrom({ minimumReleaseAge: '7 days', packageRules: [{ minimumReleaseAge: '14 days' }] }).ms,
    14 * DAY,
  );
  assert.equal(minimumReleaseAgeFrom({}).ms, null);
  assert.equal(minimumReleaseAgeFrom({ minimumReleaseAge: 'soon' }).ms, null);
  assert.equal(minimumReleaseAgeFrom({ minimumReleaseAge: '7 days', packageRules: [{ minimumReleaseAge: 'x' }] }).ms, null);
});

test('lock の key から名前を取る (scoped・入れ子・別名)', () => {
  assert.equal(packageNameOf('node_modules/a', {}), 'a');
  assert.equal(packageNameOf('node_modules/@s/b', {}), '@s/b');
  assert.equal(packageNameOf('node_modules/x/node_modules/@s/b', {}), '@s/b');
  assert.equal(packageNameOf('node_modules/alias', { name: 'real' }), 'real');
});

test('versionsOf は workspace の項目と link を除く', () => {
  const lock = {
    packages: {
      '': { name: 'root' },
      client: { name: 'client' },
      'node_modules/client': { resolved: 'client', link: true },
      'node_modules/a': entry('a', '1.0.0'),
      'node_modules/x/node_modules/a': entry('a', '1.0.0'),
    },
  };
  assert.deepEqual([...versionsOf(lock).keys()], ['a@1.0.0']);
  assert.throws(() => versionsOf({}), /packages が無い/);
});

test('新しい版 = head - base (hoist で key が動いただけは数えない)', () => {
  const base = {
    packages: {
      'node_modules/a': entry('a', '1.0.0'),
      'node_modules/b': entry('b', '2.0.0'),
      'node_modules/gone': entry('gone', '1.0.0'),
    },
  };
  const head = {
    packages: {
      'node_modules/x/node_modules/a': entry('a', '1.0.0'), // 動いただけ
      'node_modules/b': entry('b', '2.1.0'), // 版が変わった
      'node_modules/@s/c': entry('@s/c', '0.1.0'), // 新しく入った
    },
  };
  assert.deepEqual(
    newVersions(base, head).map((v) => `${v.name}@${v.version}`),
    ['@s/c@0.1.0', 'b@2.1.0'],
  );
  // base が無い (--all) ときは全部
  assert.equal(newVersions(null, head).length, 3);
});

test('脆弱性の修正の印 (Renovate の既定の vulnerabilityAlerts と同じ)', () => {
  // PR の run は branch の名前だけを見る
  assert.match(exemptionReason({ eventName: 'pull_request', headRef: 'renovate/npm-axios-vulnerability' }), /脆弱性/);
  assert.equal(exemptionReason({ eventName: 'pull_request', headRef: 'renovate/npm-minor-and-patch' }), null);
  assert.equal(
    exemptionReason({ eventName: 'pull_request', headRef: 'feature/x', commitMessage: 'fix [SECURITY]' }),
    null,
  );
  assert.equal(exemptionReason({ eventName: 'pull_request', headRef: 'renovate/npm-x-vulnerability-old' }), null);
  // push の run は commit のメッセージ
  assert.match(
    exemptionReason({
      eventName: 'push',
      commitMessage: 'Merge pull request #12 from MatsumotoDesuyo/renovate/npm-axios-vulnerability\n\nfix(deps): ...',
    }),
    /merge/,
  );
  assert.match(
    exemptionReason({ eventName: 'push', commitMessage: 'fix(deps): update dependency axios to v1.20.1 [SECURITY] (#70)' }),
    /SECURITY/,
  );
  assert.equal(
    exemptionReason({ eventName: 'push', commitMessage: 'Merge pull request #71 from MatsumotoDesuyo/renovate/npm-minor-and-patch' }),
    null,
  );
  assert.equal(exemptionReason({ eventName: '', commitMessage: '' }), null);
});

test('取得先は registry.npmjs.org だけ', () => {
  assert.equal(registryProblem(tgz('a', '1.0.0')), null);
  assert.match(registryProblem('git+https://github.com/x/y.git#abc'), /registry/);
  assert.match(registryProblem(undefined), /registry/);
  assert.match(registryProblem('https://registry.npmjs.org.evil.example/a/-/a-1.0.0.tgz'), /registry/);
});

test('境ちょうどは合格、1 ms 足りなければ不合格', () => {
  const now = Date.parse('2026-10-04T00:00:00Z');
  assert.equal(isOldEnough(now - 7 * DAY, now, 7 * DAY), true);
  assert.equal(isOldEnough(now - 7 * DAY + 1, now, 7 * DAY), false);
});

test('evaluate: 待ちに満たない版・判定できない版は赤。除外は待ちだけを合格に変える', () => {
  const now = Date.parse('2026-10-04T00:00:00Z');
  const iso = (msAgo) => new Date(now - msAgo).toISOString();
  const versions = [
    { name: 'old', version: '1.0.0', resolved: tgz('old', '1.0.0') },
    { name: 'young', version: '2.0.0', resolved: tgz('young', '2.0.0') },
  ];
  const timesByName = new Map([
    ['old', { time: { '1.0.0': iso(8 * DAY) } }],
    ['young', { time: { '2.0.0': iso(2 * DAY) } }],
  ]);
  const strict = evaluate({ versions, timesByName, nowMs: now, minAgeMs: 7 * DAY, exemption: null });
  assert.equal(strict.ok, false);
  assert.deepEqual(strict.rows.map((r) => r.status), ['OK', 'YOUNG']);

  const exempt = evaluate({ versions, timesByName, nowMs: now, minAgeMs: 7 * DAY, exemption: '脆弱性の修正' });
  assert.equal(exempt.ok, true);
  assert.deepEqual(exempt.rows.map((r) => r.status), ['OK', 'EXEMPT']);

  // registry に届かない・time が無い・取得先が違う は、除外でも赤
  const bad = [
    { name: 'down', version: '1.0.0', resolved: tgz('down', '1.0.0') },
    { name: 'notime', version: '1.0.0', resolved: tgz('notime', '1.0.0') },
    { name: 'git', version: '1.0.0', resolved: 'git+https://github.com/x/y.git' },
  ];
  const badTimes = new Map([
    ['down', { error: 'fetch failed' }],
    ['notime', { time: {} }],
  ]);
  const r = evaluate({ versions: bad, timesByName: badTimes, nowMs: now, minAgeMs: 7 * DAY, exemption: '脆弱性の修正' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.rows.map((x) => x.status), ['ERROR', 'ERROR', 'ERROR']);
});
