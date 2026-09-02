import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';
import AnalyseSentense from './analyse-sentense';

// docs/use-cases.md の UC3 と N5/N8/N9 のサーバー側の証明。
// 実サーバーを子プロセスとして起動し、同梱の実辞書 (ejdict.sqlite3) に
// 対してブラックボックスで検証する (ソースコードを一切変更しないため)。

// PORT 環境変数で待受ポートを上書きして起動する (Factor III / #7 の検証を兼ねる)
const PORT = 15001;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_ROOT = path.resolve(__dirname, '..');

let server: ChildProcess;

type Response = { status: number; body: string };

function get(pathname: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    http
      .get(BASE_URL + pathname, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, body })
        );
      })
      .on('error', reject);
  });
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await get('/api/search-word');
      return;
    } catch (e) {
      if (Date.now() > deadline) throw e;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

beforeAll(async () => {
  server = spawn(
    process.execPath,
    ['-r', 'ts-node/register', 'src/index.ts'],
    {
      cwd: SERVER_ROOT,
      stdio: 'ignore',
      env: { ...process.env, PORT: String(PORT) },
    }
  );
  await waitForServer(60000);
}, 90000);

afterAll(() => {
  if (server) server.kill();
});

describe('GET /api/search-word', () => {
  test('UCT-03/N9: 実ゲームの暗号単語 RQH で one が意味つきでヒットする', async () => {
    const res = await get('/api/search-word?word=RQH');
    expect(res.status).toBe(200);
    const rows: { word: string; mean: string }[] = JSON.parse(res.body);
    expect(Array.isArray(rows)).toBe(true);
    const one = rows.find((row) => row.word === 'one');
    expect(one).toBeDefined();
    expect(one!.mean.length).toBeGreaterThan(0);
  });

  test('候補の提示に留める: ヒットは全てシフト候補由来の単語である (§1 設計思想)', async () => {
    const res = await get('/api/search-word?word=RQH');
    const rows: { word: string }[] = JSON.parse(res.body);
    const candidates = AnalyseSentense('RQH').map((c) => c.toLowerCase());
    rows.forEach((row) => {
      expect(candidates).toContain(row.word);
    });
  });

  test('UCT-07/N5: ヒット件数は 100 件以下', async () => {
    const res = await get('/api/search-word?word=RQH');
    const rows: unknown[] = JSON.parse(res.body);
    expect(rows.length).toBeLessThanOrEqual(100);
  });

  test('UCT-06/N8: word パラメータなしは空応答 (サーバーは落ちない)', async () => {
    const res = await get('/api/search-word');
    expect(res.status).toBe(200);
    expect(res.body).toBe('');
  });

  test('UCT-06/N8: word が空文字でも空応答 (サーバーは落ちない)', async () => {
    const res = await get('/api/search-word?word=');
    expect(res.status).toBe(200);
    expect(res.body).toBe('');
  });

  test('N6/N9: 辞書に存在し得ない文字列はヒット 0 件で正常', async () => {
    const res = await get('/api/search-word?word=QQQQQQQQQQQQ');
    expect(res.status).toBe(200);
    const rows: unknown[] = JSON.parse(res.body);
    expect(rows).toEqual([]);
  });
});
