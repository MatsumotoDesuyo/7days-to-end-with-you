import express from 'express';
import { connectLogger } from 'log4js';
import path from 'path';
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
app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(__dirname, '../public/index.html')));
});
