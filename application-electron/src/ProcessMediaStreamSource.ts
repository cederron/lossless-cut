import { IMediaStreamSource } from "lossless-cut-application";

export class ProcessMediaStreamSource implements IMediaStreamSource {
  private abortController = new AbortController();
  private process: ExecaChildProcess;
  private stderr = Buffer.alloc(0);
  private videoStreamIndex?: number;
  private audioStreamIndexes?: number[];
  private seekTo: number;

  constructor(params: Parameters<typeof createMediaSourceProcess>[0]) {
    this.videoStreamIndex = params.videoStreamIndex;
    this.audioStreamIndexes = params.audioStreamIndexes;
    this.seekTo = params.seekTo;

    logger.info('Starting preview process', { 
      videoStreamIndex: this.videoStreamIndex, 
      audioStreamIndexes: this.audioStreamIndexes, 
      seekTo: this.seekTo 
    });

    this.process = createMediaSourceProcess(params);

    // Setup abort handler
    this.abortController.signal.onabort = () => {
      logger.info('Aborting preview process', { 
        videoStreamIndex: this.videoStreamIndex, 
        seekTo: this.seekTo 
      });
      this.process.kill('SIGKILL');
    };

    // Initialize process state
    this.process.stdout?.pause();

    // Capture stderr
    this.process.stderr?.on('data', (chunk) => {
      this.stderr = Buffer.concat([this.stderr, chunk]);
    });

    // Handle process completion/error logging
    (async () => {
      try {
        await this.process;
      } catch (err) {
        if (err instanceof ExecaError && err.isTerminated) {
          return;
        }
        logger.warn(err instanceof Error ? err.message : String(err));
        logger.warn(this.stderr.toString('utf8'));
      }
    })();
  }

  async readChunk(): Promise<Buffer | null> {
    const stdout = this.process.stdout;
    if (!stdout || this.abortController.signal.aborted) return null;

    return new Promise<Buffer | null>((resolve, reject) => {
      let cleanup: () => void;

      const onClose = () => {
        cleanup();
        resolve(null);
      };

      const onData = (chunk: Buffer) => {
        stdout.pause();
        cleanup();
        resolve(chunk);
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      cleanup = () => {
        stdout.off('data', onData);
        stdout.off('error', onError);
        stdout.off('close', onClose);
      };

      stdout.once('data', onData);
      stdout.once('error', onError);
      stdout.once('close', onClose);

      stdout.resume();
    });
  }

  abort(): void {
    this.abortController.abort();
  }
}