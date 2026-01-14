import { IMediaSourceInitParams, IMediaSourceStreamFactory, IMediaStream } from "lossless-cut-application";

export class HttpMediaSourceStreamFactory implements IMediaSourceStreamFactory {
    createMediaSourceStream = (params: IMediaSourceInitParams): IMediaStream => {
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
        let aborted = false;
        const abortController = new AbortController();

        const streamUrl = params.path; // `${API_BASE_URL}/stream?filePath=${encodeURIComponent(path)}&start=${seekTo}`;

        const initPromise = fetch(streamUrl, { signal: abortController.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
                }
                if (!response.body) {
                    throw new Error('Response body is null');
                }
                reader = response.body.getReader();
                return reader;
            })
            .catch((err) => {
                if (err.name === 'AbortError') {
                    console.log('Stream fetch aborted');
                } else {
                    console.error('Failed to initialize stream:', err);
                }
                throw err;
            });

        return {
            async readChunk(): Promise<Buffer<ArrayBufferLike> | null> {
                if (aborted) return null;

                try {
                    const currentReader = await initPromise;
                    const { done, value } = await currentReader.read();

                    if (done) {
                        return null;
                    }

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