import express from 'express';
import { connectLogger } from 'log4js';
import path from 'path';
import sqlite3 from 'sqlite3';
import AnalyseSentense from './analyse-sentense';
import { sysLogger, accessLogger } from './logger';

sysLogger.info('Starting Express Server...');

const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(connectLogger(accessLogger, { level: 'auto' }));

app.use(express.static(path.resolve(__dirname, '../public')));

app.listen(5001, () => {
  sysLogger.info('Start on port 5001.');
});

app.get('/api/users', async (req: express.Request, res: express.Response) => {
  const db = new sqlite3.Database('ejdict.sqlite3');
  const result: string[] = [];
  db.serialize(() => {
    //数値を一定ずらして変換
    const strs = AnalyseSentense('sea');
    const param: string = '';
    let questions: string = '';
    for (let i = 0; strs.length > i; i++) {
      strs[i] = `${strs[i].toLocaleLowerCase()}`;
      if (i !== 0) questions += ',';
      questions += '?';
    }
    console.log(param);
    const stmt = db.prepare(
      `select word,mean from items WHERE word IN(${questions}) limit 100`
    );

    stmt.all(strs, (err, rows) => {
      if (!err) {
        res.send(JSON.stringify(rows));
      }
    });
    // }
  });

  db.close();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '../public/index.html')));
});
