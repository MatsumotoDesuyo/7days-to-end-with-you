import { getLogger, configure, Configuration } from 'log4js';

const conf: Configuration = {
  appenders: {
    out: { type: 'stdout' },
    appInfoFile: {
      type: 'dateFile',
      filename: 'logs/application.log',
      pattern: '.yyyy-MM-dd',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      daysToKeep: 7,
      keepFileExt: true,
      encoding: 'utf-8',
    },
    appErrorFile: {
      type: 'dateFile',
      filename: 'logs/application.log',
      pattern: '.yyyy-MM-dd',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      daysToKeep: 7,
      keepFileExt: true,
      encoding: 'utf-8',
      layout: {
        type: 'pattern',
        pattern: '[%d] [%p] %c - %m%n%f %l %o%n%s',
      },
    },
    appInfo: {
      type: 'logLevelFilter',
      appender: 'appInfoFile',
      level: 'trace',
      maxLevel: 'info',
    },
    appError: {
      type: 'logLevelFilter',
      appender: 'appErrorFile',
      level: 'warn',
    },
    access: {
      type: 'dateFile',
      filename: 'logs/access.log',
      pattern: '.yyyy-MM-dd',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      daysToKeep: 7,
      keepFileExt: true,
      encoding: 'utf-8',
    },
    system: {
      type: 'dateFile',
      filename: 'logs/system.log',
      pattern: '.yyyy-MM-dd',
      alwaysIncludePattern: true,
      maxLogSize: 10485760,
      daysToKeep: 7,
      keepFileExt: true,
      encoding: 'utf-8',
    },
  },
  categories: {
    default: {
      appenders: ['out', 'appInfoFile'],
      level: 'info',
    },
    application: {
      appenders: ['out', 'appInfo', 'appError'],
      level: 'info',
      enableCallStack: true,
    },
    access: {
      appenders: ['out', 'access'],
      level: 'info',
    },
    system: {
      appenders: ['out', 'system'],
      level: 'info',
    },
  },
};
configure(conf);
const appLogger = getLogger('application');
const accessLogger = getLogger('access');
const sysLogger = getLogger('system');

export { appLogger, accessLogger, sysLogger };

sysLogger.info('Logger awaked!');
