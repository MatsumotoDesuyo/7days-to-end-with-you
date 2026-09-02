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

app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '../public/index.html')));
});

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
