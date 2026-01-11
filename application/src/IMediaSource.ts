export type IMediaSourceInitParams = {
    path: string;
    videoStreamIndex?: number | undefined;
    audioStreamIndexes: number[];
    seekTo: number;
    size?: number | undefined;
    fps?: number | undefined;
    rotate: number | undefined;
};

export interface IMediaSource {
    init: (params: IMediaSourceInitParams) => Promise<void>;
    readChunk: () => Promise<Buffer | null>;
    abort: () => void;
}