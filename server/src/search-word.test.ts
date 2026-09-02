import express from 'express';
import sqlite3 from 'sqlite3';
import createSearchWordHandler from './search-word';

// docs/test-cases.md UT-08: SQL エラーパスでも必ず応答が返ること (#3)

type Row = { word: string; mean: string };
type InvokeResult = { status?: number; body?: string; sent: boolean };

function createFakeDb(options: {
  error?: Error;
  rows?: Row[];
  captured?: { sql?: string; params?: string[] };
}): sqlite3.Database {
  const fake = {
    serialize(fn: () => void) {
      fn();
    },
    prepare(sql: string) {
      if (options.captured) options.captured.sql = sql;
      return {
        all(
          params: string[],
          callback: (err: Error | null, rows: Row[]) => void
        ) {
          if (options.captured) options.captured.params = params;
          callback(options.error ?? null, options.rows ?? []);
        },
      };
    },
  };
  return fake as unknown as sqlite3.Database;
}

function invoke(db: sqlite3.Database, word?: string): InvokeResult {
  const req = {
    query: word === undefined ? {} : { word },
  } as unknown as express.Request;
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
  createSearchWordHandler(db)(req, res);
  return result;
}

describe('UT-08 search-word ハンドラ', () => {
  test('N8: SQL エラー時は 500 + 空配列で必ず応答する (ハングしない)', () => {
    const result = invoke(createFakeDb({ error: new Error('boom') }), 'RQH');
    expect(result.sent).toBe(true);
    expect(result.status).toBe(500);
    expect(result.body).toBe('[]');
  });

  test('UCT-03: 成功時はヒット行を JSON で返し、候補は小文字 26 件で照会される', () => {
    const captured: { sql?: string; params?: string[] } = {};
    const rows = [{ word: 'one', mean: '一つの' }];
    const result = invoke(createFakeDb({ rows, captured }), 'RQH');
    expect(result.sent).toBe(true);
    expect(result.status).toBeUndefined();
    expect(JSON.parse(result.body as string)).toEqual(rows);
    expect(captured.params).toHaveLength(26);
    expect(captured.params).toContain('one');
    expect(captured.sql).toContain('limit 100');
  });

  test('N8: word が空のときは空応答を返す', () => {
    const result = invoke(createFakeDb({}), '');
    expect(result.sent).toBe(true);
    expect(result.body).toBeUndefined();
  });
});
