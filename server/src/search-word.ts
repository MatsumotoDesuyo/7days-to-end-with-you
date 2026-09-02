import * as Sentry from '@sentry/node';
import express from 'express';
import sqlite3 from 'sqlite3';
import { AnalyseSentense } from 'shared';
import { sysLogger } from './logger';

// UC3: 辞書検索。全シフト候補のうち辞書に存在する単語を意味つきで返す。
// lang パラメータで言語別辞書を引く (N10)。未指定・未対応言語は日本語 (ejdict)。
// resolveDb を注入するファクトリ形式にして、エラーパス (UT-08) を単体検証可能にする。
export default function createSearchWordHandler(
  resolveDb: (lang: string) => sqlite3.Database
) {
  return (req: express.Request, res: express.Response): void => {
    const lang = req.query.lang?.toString() ?? 'ja';
    const db = resolveDb(lang);
    db.serialize(() => {
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
      const respondError = (err: Error) => {
        sysLogger.error('search-word failed', err);
        Sentry.captureException(err);
        res.status(500).send(JSON.stringify([]));
      };

      // prepare 段階のエラー (辞書破損による no such table 等) はコールバックを
      // 渡さないと 'error' イベント → uncaughtException でプロセスが落ちる
      // (Sentry 実打検証 7DAYS-SERVER-2 で発覚した挙動)。コールバックで受けて
      // 実行時エラーと同じく 500 に畳む
      const stmt = db.prepare(
        `select word,mean from items WHERE word IN(${questions}) limit 100`,
        (prepareErr: Error | null) => {
          if (prepareErr) {
            respondError(prepareErr);
            return;
          }
          stmt.all(strs, (err, rows) => {
            if (err) {
              respondError(err);
              return;
            }
            res.send(JSON.stringify(rows));
          });
        }
      );
    });
  };
}
