import type { IMediaSourceInitParams } from "./IMediaSource.ts";
import type { IRunningProcess } from "./IRunningProcess.ts";

export interface IFfmpeg {
    // getMediaStream(path: string): ResultPromise<{env: Readonly<Partial<Record<string, string>>>}>;
    getStreamProcess(params: IMediaSourceInitParams): IRunningProcess;
    getFfmpegPath: () => string;
    getFfCommandLine: (cmd: string, args: readonly string[]) => string;
}