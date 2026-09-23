import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import createHealthHandler from './health';

// docs/test-cases.md UT-14: health ハンドラ (N13 / #51)

type InvokeResult = {
  status?: number;
  body?: unknown;
  headers: Record<string, string>;
};

function fakeDb(error?: Error): DatabaseSync {
  const fake = {
    prepare() {
      if (error) throw error;
      return { get: () => ({ 1: 1 }) };
    },
  };
  return fake as unknown as DatabaseSync;
}

function invoke(dbs: Map<string, DatabaseSync>): InvokeResult {
  const result: InvokeResult = { headers: {} };
  const res = {
    set(name: string, value: string) {
      result.headers[name] = value;
      return this;
    },
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  } as unknown as express.Response;
  createHealthHandler(dbs)({} as express.Request, res);
  return result;
}

describe('UT-14 health ハンドラ', () => {
  test('全辞書の照会が通れば 200 / ok', () => {
    const result = invoke(
      new Map([
        ['ja', fakeDb()],
        ['en', fakeDb()],
      ])
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: 'ok' });
    expect(result.headers['Cache-Control']).toBe('no-store');
  });

  test('1 つでも失敗すれば 503 で失敗した言語だけを返し、例外の詳細は応答に出さない', () => {
    const result = invoke(
      new Map([
        ['ja', fakeDb()],
        ['fr', fakeDb(new Error('SQLITE_CORRUPT: secret detail'))],
        ['de', fakeDb(new Error('SQLITE_ERROR: no such table: items'))],
      ])
    );
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ status: 'fail', failed: ['fr', 'de'] });
    expect(JSON.stringify(result.body)).not.toContain('SQLITE');
  });
});
