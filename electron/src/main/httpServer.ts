import express from 'express';
import morgan from 'morgan';
import http from 'node:http';
import asyncHandler from 'express-async-handler';
import assert from 'node:assert';

import { homepageUrl } from '../common/constants.js';
import logger from './logger.js';
import { container } from 'tsyringe';
import { TOKENS, type IFfmpeg, type ILogger } from 'lossless-cut-application';

    // const logger = container.resolve<ILogger>(TOKENS.Logger);

export default ({ port, onKeyboardAction }: {
  port: number, onKeyboardAction: (action: string, args: unknown[]) => Promise<void>,
}) => {
  const app = express();

  // https://expressjs.com/en/resources/middleware/morgan.html
  const morganFormat = ':remote-addr :method :url HTTP/:http-version :status - :response-time ms';
  // https://stackoverflow.com/questions/27906551/node-js-logging-use-morgan-and-winston
  app.use(morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) },
  }));

  const apiRouter = express.Router();

  app.get('/', (_req, res) => res.send(`See ${homepageUrl}`));

  app.get('/stream', (req, res) => {
    
    const { path, videoStreamIndex, audioStreamIndexes, seekTo, size, fps, rotate } = req.query;

    res.contentType('video/mp4');
    res.setHeader('Cache-Control', 'no-store');
    
    logger.info('Received /stream request', { path, videoStreamIndex, audioStreamIndexes, seekTo, size, fps, rotate });
    
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const process = ffmpeg.getStreamProcess({
      path: path as string, 
      videoStreamIndex: videoStreamIndex != null ? Number(videoStreamIndex) : undefined,
      audioStreamIndexes: audioStreamIndexes != null ? (Array.isArray(audioStreamIndexes) ? audioStreamIndexes.map((v) => Number(v)) : [Number(audioStreamIndexes)]) : [],
      seekTo: seekTo != null ? Number(seekTo) : 0,
      size: size != null ? Number(size) : undefined,
      fps: fps != null ? Number(fps) : undefined,
      rotate: rotate != null ? Number(rotate) : undefined,
    });

    const { stdout } = process;

    if(!stdout) {
      throw new Error('Process stdout is null');
    }
    stdout.pipe(res);

    req.on('close', () => {
      stdout.unpipe(res);
      process.kill('SIGKILL');
    });
  });

  app.use('/api', apiRouter);

  apiRouter.post('/action/:action', express.json(), asyncHandler(async (req, res) => {
    // eslint-disable-next-line prefer-destructuring
    const action = req.params['action'];
    const parameters = req.body as unknown;
    assert(action != null);
    await onKeyboardAction(action, [parameters]);
    res.end();
  }));

  const server = http.createServer(app);

  server.on('error', (err) => logger.error('http server error', err));

  const startHttpServer = async () => new Promise<void>((resolve, reject) => {
    // force ipv4
    const host = '127.0.0.1';
    server.listen(port, host, () => {
      logger.info('HTTP API listening on', `http://${host}:${port}/`);
      resolve();
    });

    server.once('error', reject);
  });

  return {
    startHttpServer,
  };
};
