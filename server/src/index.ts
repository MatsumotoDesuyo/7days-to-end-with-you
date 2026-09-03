// Sentry の初期化は他モジュールの読み込みより先に行う必要がある (#14)
import './instrument';
import * as Sentry from '@sentry/node';
import express from 'express';
import { connectLogger } from 'log4js';
import path from 'path';
import sqlite3 from 'sqlite3';
import createSearchWordHandler from './search-word';
import { sysLogger, accessLogger } from './logger';

sysLogger.info('Starting Express Server...');

const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(connectLogger(accessLogger, { level: 'auto' }));

app.use(express.static(path.resolve(__dirname, '../public')));

// Factor III (Config): 待受ポートは環境変数 PORT で上書き可能 (デフォルト 5001)
const port = Number(process.env.PORT) || 5001;
const server = app.listen(port, () => {
  sysLogger.info(`Start on port ${port}.`);
});

// 言語別辞書 (N10)。ja は従来の ejdict、他言語は scripts/build-dicts.mjs の生成物
const DICT_LANGS = ['en', 'fr', 'it', 'de', 'es', 'pt', 'zh'];
const dbs = new Map<string, sqlite3.Database>();
dbs.set('ja', new sqlite3.Database('ejdict.sqlite3'));
DICT_LANGS.forEach((lang) => {
  dbs.set(lang, new sqlite3.Database(`dict/${lang}.sqlite3`));
});
const jaDb = dbs.get('ja') as sqlite3.Database;
const resolveDb = (lang: string): sqlite3.Database => dbs.get(lang) ?? jaDb;
app.get('/api/search-word', createSearchWordHandler(resolveDb));

// SPA フォールバック。express 5 (path-to-regexp v8) では '*' 単体のルート構文が
// 使えないため、名前付きワイルドカード '/{*splat}' で全 GET を受ける
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '../public/index.html')));
});

// Express のエラーを Sentry へ emit する (#14)。未初期化時は no-op
Sentry.setupExpressErrorHandler(app);

// Factor IX (Disposability): SIGTERM/SIGINT で graceful shutdown する
const shutdown = (signal: string) => {
  sysLogger.info(`Received ${signal}. Shutting down...`);
  server.close(() => {
    let remaining = dbs.size;
    dbs.forEach((db) => {
      db.close(() => {
        remaining -= 1;
        if (remaining === 0) process.exit(0);
      });
    });
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
