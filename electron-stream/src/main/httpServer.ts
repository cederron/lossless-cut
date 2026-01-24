import express from 'express';
import morgan from 'morgan';
import http from 'node:http';
import asyncHandler from 'express-async-handler';
import assert from 'node:assert';

import { homepageUrl } from '../common/constants.js';
import logger from './logger.js';
import { container } from 'tsyringe';
import { TOKENS, type IFfmpeg, type IPlatform, type IUtils } from 'lossless-cut-application';

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

  app.get('/stream', asyncHandler(async (req, res) => {
    
    const { path, videoStreamIndex, audioStreamIndexes, seekTo, size, fps, rotate } = req.query;

    res.contentType('video/mp4');
    res.setHeader('Cache-Control', 'no-store');
    
    logger.info('Received /stream request', { path, videoStreamIndex, audioStreamIndexes, seekTo, size, fps, rotate });
    
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const process = await ffmpeg.getStreamProcess({
      path: path as string, 
      videoStreamIndex: videoStreamIndex != null ? Number(videoStreamIndex) : undefined,
      audioStreamIndexes: audioStreamIndexes != null ? (Array.isArray(audioStreamIndexes) ? audioStreamIndexes.map((v) => Number(v)) : [Number(audioStreamIndexes)]) : [],
      seekTo: seekTo != null ? Number(seekTo) : 0,
      size: size != null ? Number(size) : undefined,
      fps: fps != null ? Number(fps) : undefined,
      rotate: rotate != null ? Number(rotate) : undefined,
    });

    // Prevent unhandled rejection when we kill the process
    process.promise.catch((err: any) => {
      if (err && (err.signal === 'SIGKILL' || err.killed)) return;
      logger.error('Stream process error', err);
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
  }));

  app.use('/api', apiRouter);

  apiRouter.post('/action/:action', express.json(), asyncHandler(async (req, res) => {
    // eslint-disable-next-line prefer-destructuring
    const action = req.params['action'];
    const parameters = req.body as unknown;
    assert(action != null);
    await onKeyboardAction(action, [parameters]);
    res.end();
  }));

  apiRouter.post('/readFrames', express.json(), asyncHandler(async (req, res) => {
    const { filePath, from, to, streamIndex } = req.body as { filePath: string; from?: number; to?: number; streamIndex: number; };
    logger.info('API readFrames called', { filePath, from, to, streamIndex });
    assert(filePath != null);
    assert(streamIndex != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const frames = await ffmpeg.readFrames({ filePath, from, to, streamIndex });
    res.json({ frames });
  }));

  apiRouter.post('/readFramesAroundTime', express.json(), asyncHandler(async (req, res) => {
    const { filePath, aroundTime, streamIndex, window } = req.body as { filePath: string; aroundTime: number; streamIndex: number; window: number; };
    logger.info('API readFramesAroundTime called', { filePath, aroundTime, streamIndex, window });
    assert(filePath != null);
    assert(aroundTime != null);
    assert(streamIndex != null);
    assert(window != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const frames = await ffmpeg.readFramesAroundTime({ filePath, aroundTime, streamIndex, window });
    res.json({ frames });
  }));

  apiRouter.post('/findNearestKeyFrameTime', express.json(), asyncHandler(async (req, res) => {
    const { frames, time, direction, fps } = req.body as { frames: any[]; time: number; direction: number; fps: number | undefined; };
    logger.info('API findNearestKeyFrameTime called', { time, direction, fps, frameCount: frames.length });
    assert(frames != null);
    assert(time != null);
    assert(direction != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const nearestTime = await ffmpeg.findNearestKeyFrameTime({ frames, time, direction, fps });
    res.json({ nearestTime });
  }));

  apiRouter.post('/renderWaveformPng', express.json(), asyncHandler(async (req, res) => {
    const { filePath, start, duration, resample, color, streamIndex, timeout } = req.body as { filePath: string; start?: number; duration?: number; resample?: number; color: string; streamIndex: number; timeout?: number; };
    logger.info('API renderWaveformPng called', { filePath, start, duration, resample, color, streamIndex, timeout });
    assert(filePath != null);
    assert(streamIndex != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const result = await ffmpeg.renderWaveformPng({ filePath, start, duration, resample, color, streamIndex, timeout });
    res.json({ buffer: result.buffer.toString('base64')});
  }));

  /* TODO, this is called very frequently when a video is playing, consider optimizing */
  apiRouter.post('/getSuffixedOutPath', express.json(), asyncHandler(async (req, res) => {
    const { customOutDir, filePath, nameSuffix } = req.body as { customOutDir?: string; filePath?: string; nameSuffix: string; };
    logger.info('API getSuffixedOutPath called', { customOutDir, filePath, nameSuffix });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const outPath = await utils.getSuffixedOutPath({ customOutDir, filePath, nameSuffix });
    res.json({ outPath });
  }));

  // apiRouter.post('/transferTimestamps', express.json(), asyncHandler(async (req, res) => {
  //   const { inPath, outPath, cutFrom, cutTo, duration, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart } = req.body as { inPath: string; outPath: string; cutFrom?: number; cutTo?: number; duration?: number; treatInputFileModifiedTimeAsStart: boolean; treatOutputFileModifiedTimeAsStart: boolean | null; };
  //   logger.info('API transferTimestamps called', { inPath, outPath, cutFrom, cutTo, duration, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart });
  //   const utils = container.resolve<IUtils>(TOKENS.Utils);
  //   await utils.transferTimestamps({ inPath, outPath, cutFrom, cutTo, duration, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart });
  //   res.end();
  // }));

  apiRouter.post('/getOutFileExtension', express.json(), asyncHandler(async (req, res) => {
    const { isCustomFormatSelected, outFormat, filePath } = req.body as { isCustomFormatSelected?: boolean; outFormat: string; filePath: string; };
    logger.info('API getOutFileExtension called', { isCustomFormatSelected, outFormat, filePath });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const extension =  await utils.getOutFileExtension({ isCustomFormatSelected, outFormat, filePath });
    res.json({ extension });
  }));

  apiRouter.post('/pathJoin', express.json(), asyncHandler(async (req, res) => {
    const { paths } = req.body as { paths: string[]; };
    logger.info('API pathJoin called', { paths });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const joinedPath =  await utils.pathJoin(...paths);
    res.json({ joinedPath });
  }));

  apiRouter.post('/dirname', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API dirname called', { path });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const dirName =  await utils.dirname(path);
    res.json({ dirName });
  }));

  apiRouter.post('/getOutDir', express.json(), asyncHandler(async (req, res) => {
    const { customOutDir, filePath } = req.body as { customOutDir?: string; filePath?: string; };
    logger.info('API getOutDir called', { customOutDir, filePath });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const outDir =  await utils.getOutDir(customOutDir, filePath);
    res.json({ outDir });
  }));

  apiRouter.post('/unlinkWithRetry', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API unlinkWithRetry called', { path });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    await utils.unlinkWithRetry(path);
    res.end();
  }));

  apiRouter.post('/getOutPath', express.json(), asyncHandler(async (req, res) => {
    const { customOutDir, filePath, fileName } = req.body as { customOutDir?: string; filePath?: string; fileName: string; };
    logger.info('API getOutPath called', { customOutDir, filePath, fileName });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const outPath =  await utils.getOutPath({ customOutDir, filePath, fileName });
    res.json({ outPath });
  }));

  apiRouter.post('/getFileUri', express.json(), asyncHandler(async (req, res) => {
    const { path, cacheBuster } = req.body as { path?: string; cacheBuster: number; };
    logger.info('API getFileUri called', { path, cacheBuster });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const fileUri =  await utils.getFileUri(path, cacheBuster);
    res.json({ fileUri });
  }));

  apiRouter.post('/isDirectory', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API isDirectory called', { path });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const isDirectory =  await utils.isDirectory(path);
    res.json({ isDirectory });
  }));

  apiRouter.post('/isFile', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API isFile called', { path });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const isFile =  await utils.isFile(path);
    res.json({ isFile });
  }));

  apiRouter.post('/basename', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API basename called', { path });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const baseName =  await utils.basename(path);
    res.json({ baseName });
  }));

  apiRouter.post('/runFfmpeg', express.json(), async (req, res) => {
    const { ffmpegArgs, duration } = req.body as { ffmpegArgs: string[]; duration?: number; };
    logger.info('API runFfmpeg called', { ffmpegArgs, duration });

    try {
      const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
      res.setHeader('Content-Type', 'text/plain');
      
      await ffmpeg.runFfmpegWithProgress({
        ffmpegArgs,
        duration,
        onProgress: (progress) => {
          res.write(JSON.stringify({ progress }) + '\n');
        }
      });
      res.end();
    } catch (err: any) {
      logger.error('Error running ffmpeg', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      } else {
        res.write(JSON.stringify({ error: err.message }) + '\n');
        res.end();
      }
    }
  });

  apiRouter.post('/resolvePathIfNeeded', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API resolvePathIfNeeded called', { path });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const resolvedPath =  await utils.resolvePathIfNeeded(path);
    res.json({ resolvedPath });
  }));

  // apiRouter.post('/getHtml5ifiedPath', express.json(), asyncHandler(async (req, res) => {
  //   const { cod, fp, type } = req.body as { cod?: string; fp: string; type: Html5ifyMode; };
  //   logger.info('API getHtml5ifiedPath called', { cod, fp, type });
  //   const utils = container.resolve<IUtils>(TOKENS.Utils);
  //   const html5ifiedPath =  await utils.getHtml5ifiedPath(cod, fp, type);
  //   res.json({ html5ifiedPath });
  // }));

  apiRouter.post('/getDuration', express.json(), asyncHandler(async (req, res) => {
    const { filePath } = req.body as { filePath: string; };
    logger.info('API getDuration called', { filePath });
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const duration =  await ffmpeg.getDuration(filePath);
    res.json({ duration });
  }));

  apiRouter.post('/getOutPath', express.json(), asyncHandler(async (req, res) => {
    const { customOutDir, filePath, fileName } = req.body as { customOutDir?: string; filePath?: string; fileName: string; };
    logger.info('API getOutPath called', { customOutDir, filePath, fileName });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const outPath =  await utils.getOutPath({ customOutDir, filePath, fileName });
    res.json({ outPath });
  }));

  apiRouter.post('/pathResolve', express.json(), asyncHandler(async (req, res) => {
    const { paths } = req.body as { paths: string[]; };
    logger.info('API pathResolve called', { paths });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const resolvedPath =  await utils.pathResolve(...paths);
    res.json({ resolvedPath });
  }));

  apiRouter.post(`/getFfCommandLine`, express.json(), asyncHandler(async (req, res) => {
    const { cmd, args } = req.body as { cmd: string; args: readonly string[]; };
    logger.info('API getFfCommandLine called', { cmd, args });
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const commandLine =  await ffmpeg.getFfCommandLine(cmd, args);
    res.json({ commandLine });
  }));

  apiRouter.post('/runFfmpegConcat', express.json(), async (req, res) => {
    const { ffmpegArgs, concatTxt, totalDuration } = req.body as { ffmpegArgs: string[]; concatTxt: string; totalDuration: number; };
    logger.info('API runFfmpegConcat called', { ffmpegArgs, concatTxt, totalDuration });
    try {
      const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
      res.setHeader('Content-Type', 'text/plain');
      await ffmpeg.runFfmpegConcat({
        ffmpegArgs,
        concatTxt,
        totalDuration,
        onProgress: (progress) => {
          res.write(JSON.stringify({ progress }) + '\n');
        }
      });
      res.end();
    } catch (err: any) {
      logger.error('Error running ffmpeg concat', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      } else {
        res.write(JSON.stringify({ error: err.message }) + '\n');
        res.end();
      }
    }
  });

  apiRouter.post('/readKeyframesAroundTime', express.json(), asyncHandler(async (req, res) => {
    const { filePath, aroundTime, streamIndex, window } = req.body as { filePath: string; aroundTime: number; streamIndex: number; window: number; };
    logger.info('API readKeyframesAroundTime called', { filePath, aroundTime, streamIndex, window });
    assert(filePath != null);
    assert(aroundTime != null);
    assert(streamIndex != null);
    assert(window != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const keyframes = await ffmpeg.readKeyframesAroundTime({ filePath, aroundTime, streamIndex, window });
    res.json({ keyframes });
  }));

  apiRouter.post('/findNextKeyframe', express.json(), asyncHandler(async (req, res) => {
    const { keyframes, time } = req.body as { keyframes: any[]; time: number; };
    logger.info('API findNextKeyframe called', { time, frameCount: keyframes.length });
    assert(keyframes != null);
    assert(time != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const nextKeyframe = await ffmpeg.findNextKeyframe(keyframes, time);
    res.json({ nextKeyframe });
  }));

  apiRouter.post('/findKeyframeAtExactTime', express.json(), asyncHandler(async (req, res) => {
    const { keyframes, time } = req.body as { keyframes: any[]; time: number; };
    logger.info('API findKeyframeAtExactTime called', { time, frameCount: keyframes.length });
    assert(keyframes != null);
    assert(time != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const keyframe = await ffmpeg.findKeyframeAtExactTime(keyframes, time);
    res.json({ keyframe });
  }));

  apiRouter.post('/createChaptersFromSegments', express.json(), asyncHandler(async (req, res) => {
    const { segmentPaths, chapterNames } = req.body as { segmentPaths: string[]; chapterNames?: (string | undefined)[] | undefined; };
    logger.info('API createChaptersFromSegments called', { segmentPaths, chapterNames });
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const chapters = await ffmpeg.createChaptersFromSegments({ segmentPaths, chapterNames });
    res.json({ chapters });
  }));

  apiRouter.post('/getExperimentalArgs', express.json(), asyncHandler(async (req, res) => {
    const { ffmpegExperimental } = req.body as { ffmpegExperimental: boolean; };
    logger.info('API getExperimentalArgs called', { ffmpegExperimental });
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const experimentalArgs = await ffmpeg.getExperimentalArgs(ffmpegExperimental);
    res.json({ experimentalArgs });
  }));

  apiRouter.post('/getVideoTimescaleArgs', express.json(), asyncHandler(async (req, res) => {
    const { videoTimebase } = req.body as { videoTimebase: number | undefined; };
    logger.info('API getVideoTimescaleArgs called', { videoTimebase });
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const videoTimescaleArgs = await ffmpeg.getVideoTimescaleArgs(videoTimebase);
    res.json({ videoTimescaleArgs });
  }));

  apiRouter.post('/readFileFfprobeMeta', express.json(), asyncHandler(async (req, res) => {
    const { filePath } = req.body as { filePath: string; };
    logger.info('API readFileFfprobeMeta called', { filePath });
    assert(filePath != null);
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
    const meta = await ffmpeg.readFileFfprobeMeta(filePath);
    res.json({ meta });
  }));

  apiRouter.post('/pathExists', express.json(), asyncHandler(async (req, res) => {
    const { path } = req.body as { path: string; };
    logger.info('API pathExists called', { path });
    assert(path != null);
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const exists = await utils.pathExists(path);
    res.json({ exists });
  }));

  apiRouter.post('/getAppPath', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API getAppPath called');
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const appPath = await utils.getAppPath();
    res.json({ appPath });
  }));

  apiRouter.post('/getSuffixedFileName', express.json(), asyncHandler(async (req, res) => {
    const { fileName, nameSuffix } = req.body as { fileName: string; nameSuffix: string; };
    logger.info('API getSuffixedFileName called', { fileName, nameSuffix });
    const utils = container.resolve<IUtils>(TOKENS.Utils);
    const suffixedFileName = await utils.getSuffixedFileName(fileName, nameSuffix);
    res.json({ suffixedFileName });
  }));

  apiRouter.post('/isWindows', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API isWindows called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const isWindows = platform.isWindows();
    res.json({ isWindows });
  }));

  apiRouter.post('/isMac', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API isMac called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const isMac = platform.isMac();
    res.json({ isMac });
  }));

  apiRouter.post('/isLinux', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API isLinux called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const isLinux = platform.isLinux();
    res.json({ isLinux });
  }));

  apiRouter.post('/arch', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API arch called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const arch = platform.arch();
    res.json({ arch });
  }));

  apiRouter.post('/isDev', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API isDev called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const isDev = platform.isDev();
    res.json({ isDev });
  }));

  apiRouter.post('/getResourcesPath', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API getResourcesPath called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const resourcesPath = platform.getResourcesPath();
    res.json({ resourcesPath });
  }));

  apiRouter.post('/getPlatform', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API getPlatform called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const plat = platform.getPlatform();
    res.json({ platform: plat });
  }));

  apiRouter.post('/isPackaged', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API isPackaged called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const isPackaged = platform.isPackaged();
    res.json({ isPackaged });
  }));

  apiRouter.post('/isMasBuild', express.json(), asyncHandler(async (_req, res) => {
    logger.info('API isMasBuild called');
    const platform = container.resolve<IPlatform>(TOKENS.Platform);
    const isMasBuild = platform.isMasBuild();
    res.json({ isMasBuild });
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
