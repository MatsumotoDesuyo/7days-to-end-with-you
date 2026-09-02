import { getLogger, configure, Configuration } from 'log4js';

// Factor XI (Logs): ログはイベントストリームとして stdout へ出力する。
// 収集・保管・ローテーションは platform 側の責務 (DEPLOYMENT.md)。
const conf: Configuration = {
  appenders: {
    out: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    application: { appenders: ['out'], level: 'info', enableCallStack: true },
    access: { appenders: ['out'], level: 'info' },
    system: { appenders: ['out'], level: 'info' },
  },
};
configure(conf);
const appLogger = getLogger('application');
const accessLogger = getLogger('access');
const sysLogger = getLogger('system');

export { appLogger, accessLogger, sysLogger };

sysLogger.info('Logger awaked!');
