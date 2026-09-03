import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import createSearchWordHandler from './search-word';

// docs/test-cases.md UT-08: SQL エラーパスでも必ず応答が返ること (#3)

type Row = { word: string; mean: string };
type InvokeResult = { status?: number; body?: string; sent: boolean };

function createFakeDb(options: {
  error?: Error;
  prepareError?: Error;
  rows?: Row[];
  captured?: { sql?: string; params?: string[] };
}): DatabaseSync {
  const fake = {
    // node:sqlite は同期 API で、prepare も all も失敗時は例外を投げる
    prepare(sql: string) {
      if (options.captured) options.captured.sql = sql;
      if (options.prepareError) throw options.prepareError;
      return {
        all(...params: string[]) {
          if (options.captured) options.captured.params = params;
          if (options.error) throw options.error;
          return options.rows ?? [];
        },
      };
    },
  };
  return fake as unknown as DatabaseSync;
}

function invoke(
  db: DatabaseSync,
  word?: string,
  lang?: string,
  onResolve?: (lang: string) => void
): InvokeResult {
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
  // node:sqlite は同期 API のため、ハンドラは戻った時点で応答を終えている
  createSearchWordHandler(resolveDb)(req, res);
  return result;
}

describe('UT-08 search-word ハンドラ', () => {
  test('N8: SQL 実行エラー時は 500 + 空配列で必ず応答する (ハングしない)', () => {
    const result = invoke(createFakeDb({ error: new Error('boom') }), 'RQH');
    expect(result.sent).toBe(true);
    expect(result.status).toBe(500);
    expect(result.body).toBe('[]');
  });

  test('N8: prepare 段階のエラー (辞書破損等) でも 500 で応答しプロセスは落ちない', () => {
    // 辞書破損時の prepare 失敗。node:sqlite は同期例外として投げるため
    // try/catch で 500 に畳む (sqlite3 時代はコールバック未指定だと
    // uncaughtException でプロセスが落ちていた。Sentry 実打検証 7DAYS-SERVER-2)
    const result = invoke(
      createFakeDb({ prepareError: new Error('SQLITE_ERROR: no such table') }),
      'RQH'
    );
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

  test('N10: lang パラメータがそのまま辞書リゾルバに渡る (未指定は ja)', () => {
    const requested: string[] = [];
    invoke(createFakeDb({}), 'RQH', 'fr', (lang) => requested.push(lang));
    invoke(createFakeDb({}), 'RQH', undefined, (lang) => requested.push(lang));
    expect(requested).toEqual(['fr', 'ja']);
  });
});
