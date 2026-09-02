import express from 'express';
import sqlite3 from 'sqlite3';
import { AnalyseSentense } from 'shared';
import { sysLogger } from './logger';

// UC3: 辞書検索。全シフト候補のうち辞書に存在する単語を意味つきで返す。
// db を注入するファクトリ形式にして、エラーパス (UT-08) を単体検証可能にする。
export default function createSearchWordHandler(db: sqlite3.Database) {
  return (req: express.Request, res: express.Response): void => {
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
      const stmt = db.prepare(
        `select word,mean from items WHERE word IN(${questions}) limit 100`
      );

      stmt.all(strs, (err, rows) => {
        if (err) {
          // #3 (N8): エラー時にも必ず応答を返す (クライアントをハングさせない)
          sysLogger.error('search-word failed', err);
          res.status(500).send(JSON.stringify([]));
          return;
        }
        res.send(JSON.stringify(rows));
      });
    });
  };
}
