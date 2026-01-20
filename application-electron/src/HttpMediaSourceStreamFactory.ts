import { type ILogger, IMediaSourceInitParams, IMediaSourceStreamFactory, IMediaStream, TOKENS } from "lossless-cut-application";
import { inject, injectable } from "tsyringe";

@injectable()
export class HttpMediaSourceStreamFactory implements IMediaSourceStreamFactory {
    
    logger: ILogger;

    constructor(@inject(TOKENS.Logger) logger: ILogger) {
        this.logger = logger;
    }
    
    createMediaSourceStream = (params: IMediaSourceInitParams): IMediaStream => {
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
        let aborted = false;
        const abortController = new AbortController();

        // const streamUrl = params.path; // `${API_BASE_URL}/stream?filePath=${encodeURIComponent(path)}&start=${seekTo}`;
        // add params to url
        const streamUrlBase = 'http://localhost:8080/stream';
        const url = new URL(streamUrlBase);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
            }
        });
        const streamUrl = url.toString();

        this.logger.info('Creating HTTP media source stream', { streamUrl, params });

        const initPromise = fetch(streamUrl, { signal: abortController.signal })
            .then((response) => {
                if (!response.ok) {
                    this.logger.info('Creating HTTP media source stream failed', { streamUrl, params, status: response.status, statusText: response.statusText });
                    throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
                }
                if (!response.body) {
                    this.logger.info('Creating HTTP media source stream failed', { streamUrl, params, reason: 'Response body is null' });
                    throw new Error('Response body is null');
                }
                reader = response.body.getReader();
                return reader;
            })
            .catch((err) => {
                this.logger.info('Creating HTTP media source stream failed', { streamUrl, params, error: err });
                if (err.name === 'AbortError') {
                    console.log('Stream fetch aborted');
                } else {
                    console.error('Failed to initialize stream:', err);
                }
                throw err;
            });

        return {
            readChunk: async (): Promise<Buffer<ArrayBufferLike> | null> => {
                // this.logger.info('Reading chunk from HTTP media source stream', { streamUrl, params, aborted });
                if (aborted) return null;

                try {
                    const currentReader = await initPromise;
                    // this.logger.info('Reading chunk from HTTP media source stream - reader ready', { streamUrl, params });
                    const { done, value } = await currentReader.read();
                    // this.logger.info('Reading chunk from HTTP media source stream - chunk read', { streamUrl, params, done, valueLength: value?.length ?? 0 });
                    if (done) {
                        // return null;
                    }
                    if(!value) return null;

                    return Buffer.from(value);
                } catch (err) {
                    if ((err as Error).name === 'AbortError' || aborted) {
                        return null;
                    }
                    throw err;
                }
            },
            abort() {
                aborted = true;
                abortController.abort();
                if (reader) {
                    reader.cancel().catch(() => { });
                }
            },
        };
    }
}