export interface IMediaStream {
    abort: () => void;
    readChunk: () => Promise<Buffer | null>;
}