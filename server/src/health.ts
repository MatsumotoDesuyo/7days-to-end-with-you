import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { sysLogger } from './logger';

// N13 (#51): 全辞書に軽い照会をし、すべて通れば 200、1 つでも失敗すれば 503。
// SPA フォールバックが全 GET を 200 で返すため、辞書の故障を外形から拾う口はここだけ。
// platform の deploy 判定と Grafana の probe はステータスだけを見る (DEPLOYMENT.md)。
// 本文には失敗した言語だけを載せ、例外の詳細は stdout にだけ出す。
export default function createHealthHandler(dbs: Map<string, DatabaseSync>) {
  return (_req: express.Request, res: express.Response): void => {
    const failed: string[] = [];
    dbs.forEach((db, lang) => {
      try {
        db.prepare('select 1 from items limit 1').get();
      } catch (err) {
        sysLogger.error(`health: dictionary ${lang} failed`, err);
        failed.push(lang);
      }
    });
    res.set('Cache-Control', 'no-store');
    if (failed.length === 0) {
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(503).json({ status: 'fail', failed });
    }
  };
}
