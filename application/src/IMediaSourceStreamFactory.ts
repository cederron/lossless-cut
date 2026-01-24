import type { IMediaSourceInitParams } from "./IMediaSource.ts";
import type { IMediaStream } from "./IMediaStream.ts";

export interface IMediaSourceStreamFactory {
    createMediaSourceStream: (params: IMediaSourceInitParams) => Promise<IMediaStream>;
}