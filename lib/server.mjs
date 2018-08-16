import compression from 'compression';
import express from 'express';
import favicon from 'serve-favicon';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import path from 'path';
import socket from 'socket.io';
import { isUndefined } from 'lodash';
import morgan from 'morgan';
import logger from './logger.mjs';
import events from './emitter.mjs';

const pubDir = path.join(__dirname, '..', 'public');

export default function createServer(base, port, { key, cert }) {
  base = base.replace(/\/*$/, "");
  logger.info(`Base path is ${base}`);
  events.emit('debug', `key: ${key}, cert: ${cert}, port: ${port}, base: ${base}`);
  const app = express();
  const wetty = (req, res) => res.sendFile(path.join(pubDir, 'index.html'));
  app
    .use(morgan('combined', { stream: logger.stream }))
    .use(helmet())
    .use(compression())
    .use(favicon(path.join(pubDir, 'favicon.ico')))
    .get(base + '/', wetty)
    .use(base, express.static(path.join(__dirname, '..', 'dist')));

  return socket(
    !isUndefined(key) && !isUndefined(cert)
      ? https.createServer({ key, cert }, app).listen(port, () => {
          events.server(port, 'https');
        })
      : http.createServer(app).listen(port, () => {
          events.server(port, 'http');
        }),
    { path: base + 'socket.io' }
  );
}
