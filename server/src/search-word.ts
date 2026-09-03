import * as Sentry from '@sentry/node';
import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { AnalyseSentense } from 'shared';
import { sysLogger } from './logger';

// UC3: 辞書検索。全シフト候補のうち辞書に存在する単語を意味つきで返す。
// lang パラメータで言語別辞書を引く (N10)。未指定・未対応言語は日本語 (ejdict)。
// resolveDb を注入するファクトリ形式にして、エラーパス (UT-08) を単体検証可能にする。
export default function createSearchWordHandler(
  resolveDb: (lang: string) => DatabaseSync
) {
  return (req: express.Request, res: express.Response): void => {
    const lang = req.query.lang?.toString() ?? 'ja';
    const db = resolveDb(lang);
    const searchWord = req.query.word?.toString() ?? '';
    if (searchWord === '') {
      res.send();
      return;
    }
    //数値を一定ずらして変換
    const strs: string[] = AnalyseSentense(searchWord);
    let questions = '';
    for (let i = 0; strs.length > i; i++) {
      strs[i] = `${strs[i].toLocaleLowerCase()}`;
      if (i !== 0) questions += ',';
      questions += '?';
    }
    // #3 (N8): エラー時にも必ず応答を返す (クライアントをハングさせない)
    // #14: ハンドリング済みエラーも Sentry へ emit (未初期化時は no-op)
    // node:sqlite は同期 API で、prepare 段階 (辞書破損による no such table 等)・
    // 実行段階のどちらの失敗も例外として送出するため、try/catch 一本で畳める
    // (sqlite3 時代はコールバック未指定だと uncaughtException になっていた。
    //  Sentry 実打検証 7DAYS-SERVER-2)
    try {
      const stmt = db.prepare(
        `select word,mean from items WHERE word IN(${questions}) limit 100`
      );
      res.send(JSON.stringify(stmt.all(...strs)));
    } catch (err) {
      sysLogger.error('search-word failed', err);
      Sentry.captureException(err);
      res.status(500).send(JSON.stringify([]));
    }
  };
}
