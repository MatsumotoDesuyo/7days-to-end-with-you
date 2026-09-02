import express from 'express';
import sqlite3 from 'sqlite3';
import createSearchWordHandler from './search-word';

// docs/test-cases.md UT-08: SQL エラーパスでも必ず応答が返ること (#3)

type Row = { word: string; mean: string };
type InvokeResult = { status?: number; body?: string; sent: boolean };

function createFakeDb(options: {
  error?: Error;
  prepareError?: Error;
  rows?: Row[];
  captured?: { sql?: string; params?: string[] };
}): sqlite3.Database {
  const fake = {
    serialize(fn: () => void) {
      fn();
    },
    prepare(sql: string, callback: (err: Error | null) => void) {
      if (options.captured) options.captured.sql = sql;
      // 実物の sqlite3 と同様、prepare の成否は非同期のコールバックで通知する
      // (同期呼び出しにすると const stmt の代入前にコールバックが走り実態と乖離する)
      setImmediate(() => callback(options.prepareError ?? null));
      return {
        all(
          params: string[],
          allCallback: (err: Error | null, rows: Row[]) => void
        ) {
          if (options.captured) options.captured.params = params;
          allCallback(options.error ?? null, options.rows ?? []);
        },
      };
    },
  };
  return fake as unknown as sqlite3.Database;
}

async function invoke(
  db: sqlite3.Database,
  word?: string,
  lang?: string,
  onResolve?: (lang: string) => void
): Promise<InvokeResult> {
  const query: Record<string, string> = {};
  if (word !== undefined) query.word = word;
  if (lang !== undefined) query.lang = lang;
  const req = { query } as unknown as express.Request;
  const result: InvokeResult = { sent: false };
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    send(body?: string) {
      result.body = body;
      result.sent = true;
      return this;
    },
  } as unknown as express.Response;
  const resolveDb = (requested: string) => {
    if (onResolve) onResolve(requested);
    return db;
  };
  createSearchWordHandler(resolveDb)(req, res);
  // prepare コールバック (setImmediate) の完了を待つ
  await new Promise((resolve) => setImmediate(resolve));
  return result;
}

describe('UT-08 search-word ハンドラ', () => {
  test('N8: SQL 実行エラー時は 500 + 空配列で必ず応答する (ハングしない)', async () => {
    const result = await invoke(
      createFakeDb({ error: new Error('boom') }),
      'RQH'
    );
    expect(result.sent).toBe(true);
    expect(result.status).toBe(500);
    expect(result.body).toBe('[]');
  });

  test('N8: prepare 段階のエラー (辞書破損等) でも 500 で応答しプロセスは落ちない', async () => {
    // sqlite3 は prepare 失敗をコールバックなしだと uncaughtException にする
    // (Sentry 実打検証 7DAYS-SERVER-2 で発覚)。コールバック受けで 500 に畳む
    const result = await invoke(
      createFakeDb({ prepareError: new Error('SQLITE_ERROR: no such table') }),
      'RQH'
    );
    expect(result.sent).toBe(true);
    expect(result.status).toBe(500);
    expect(result.body).toBe('[]');
  });

  test('UCT-03: 成功時はヒット行を JSON で返し、候補は小文字 26 件で照会される', async () => {
    const captured: { sql?: string; params?: string[] } = {};
    const rows = [{ word: 'one', mean: '一つの' }];
    const result = await invoke(createFakeDb({ rows, captured }), 'RQH');
    expect(result.sent).toBe(true);
    expect(result.status).toBeUndefined();
    expect(JSON.parse(result.body as string)).toEqual(rows);
    expect(captured.params).toHaveLength(26);
    expect(captured.params).toContain('one');
    expect(captured.sql).toContain('limit 100');
  });

  test('N8: word が空のときは空応答を返す', async () => {
    const result = await invoke(createFakeDb({}), '');
    expect(result.sent).toBe(true);
    expect(result.body).toBeUndefined();
  });

  test('N10: lang パラメータがそのまま辞書リゾルバに渡る (未指定は ja)', async () => {
    const requested: string[] = [];
    await invoke(createFakeDb({}), 'RQH', 'fr', (lang) => requested.push(lang));
    await invoke(createFakeDb({}), 'RQH', undefined, (lang) =>
      requested.push(lang)
    );
    expect(requested).toEqual(['fr', 'ja']);
  });
});
