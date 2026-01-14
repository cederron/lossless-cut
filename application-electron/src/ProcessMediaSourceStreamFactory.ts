import { IFfmpeg, ILogger, IMediaSourceInitParams, IMediaSourceStreamFactory, IMediaStream } from "lossless-cut-application";

export class ProcessMediaSourceStreamFactory implements IMediaSourceStreamFactory {

    logger: ILogger;
    ffmpeg: IFfmpeg;

    constructor(logger: ILogger, ffmpeg: IFfmpeg) {
        this.logger = logger;
        this.ffmpeg = ffmpeg;
    }

    createMediaSourceStream = (params: IMediaSourceInitParams): IMediaStream => {
        const abortController = new AbortController();
        const { videoStreamIndex, audioStreamIndexes, seekTo } = params;
        this.logger.info('Starting preview process', { videoStreamIndex, audioStreamIndexes, seekTo });
        // const process = this.createMediaSourceProcess(params);
        const process = this.ffmpeg.getStreamProcess(params);

        // eslint-disable-next-line unicorn/prefer-add-event-listener
        abortController.signal.onabort = () => {
            this.logger.info('Aborting preview process', { videoStreamIndex, audioStreamIndexes, seekTo });
            process.kill('SIGKILL');
        };

        const { stdout } = process;

        if(!stdout) {
            throw new Error('Process stdout is null');
        }

        stdout.pause();

        const readChunk = async () => new Promise<Buffer | null>((resolve, reject) => {
            let cleanup: () => void;

            const onClose = () => {
                cleanup();
                resolve(null);
            };

            // poor man's backpressure handling: we only read one chunk at a time
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

        function abort() {
            abortController.abort();
        }

        let stderr = Buffer.alloc(0);
        process.stderr?.on('data', (chunk: any) => {
            stderr = Buffer.concat([stderr, chunk]);
        });

        (async () => {
            try {
                await process;
            } catch (err) {
                if (err instanceof ExecaError && err.isTerminated) {
                    return;
                }

                this.logger.warn(err instanceof Error ? err.message : String(err));
                this.logger.warn(stderr.toString('utf8'));
            }
        })();

        return { abort, readChunk };
    };

    // createMediaSourceProcess({ path, videoStreamIndex, audioStreamIndexes, seekTo, size, fps, rotate }: {
    //     path: string,
    //     videoStreamIndex?: number | undefined,
    //     audioStreamIndexes: number[],
    //     seekTo: number,
    //     size?: number | undefined,
    //     fps?: number | undefined,
    //     rotate: number | undefined,
    // }) {

    // }
}