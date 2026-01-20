import type { IMediaSourceInitParams } from "./IMediaSource.ts";
import type { CaptureFormat, DetectedSegment, FFprobeChapter, FFprobeFormat, FFprobeStream, Frame, Waveform } from "./index.ts";
import type { IRunningProcess } from "./IRunningProcess.ts";

export interface IFfmpeg {
    // getMediaStream(path: string): ResultPromise<{env: Readonly<Partial<Record<string, string>>>}>;
    getStreamProcess(params: IMediaSourceInitParams): IRunningProcess;
    getFfmpegPath: () => string;
    getFfCommandLine: (cmd: string, args: readonly string[]) => string;
    renderWaveformPng({ filePath, start, duration, resample, color, streamIndex, timeout }: {
        filePath: string,
        start?: number,
        duration?: number,
        resample?: number,
        color: string,
        streamIndex: number,
        timeout?: number,
    }): Promise<Waveform>;
    mapTimesToSegments(times: number[], includeLast: boolean): {
        start: number;
        end: number | undefined;
    }[];
    detectSceneChanges({ filePath, streamId, minChange, onProgress, onSegmentDetected, from, to }: {
        filePath: string,
        streamId: number | undefined
        minChange: number | string,
        onProgress: (p: number) => void,
        onSegmentDetected: (p: DetectedSegment) => void,
        from: number,
        to: number,
    }): Promise<{
        ffmpegArgs: string[];
    }>;
    captureFrames({ from, to, videoPath, outPathTemplate, quality, filter, framePts, onProgress, captureFormat }: {
        from: number,
        to?: number | undefined,
        videoPath: string,
        outPathTemplate: string,
        quality: number,
        filter?: string | undefined,
        framePts?: boolean | undefined,
        onProgress: (p: number) => void,
        captureFormat: CaptureFormat,
    }): Promise<string[]>;
    captureFrameToFile({ timestamp, videoPath, outPath, quality }: {
        timestamp: number,
        videoPath: string,
        outPath: string,
        quality: number,
    }): Promise<string[]>;

    captureFrameToClipboard({ timestamp, videoPath, quality }: {
        timestamp: number,
        videoPath: string,
        quality: number,
    }): Promise<void>;

    runFfmpegConcat({ ffmpegArgs, concatTxt, totalDuration, onProgress }: {
        ffmpegArgs: string[], concatTxt: string, totalDuration: number, onProgress: (a: number) => void
    }): Promise<void>;

    runFfmpegWithProgress({ ffmpegArgs, duration, onProgress }: {
        ffmpegArgs: string[],
        duration?: number | undefined,
        onProgress: (a: number) => void,
    }): Promise<void>;

    getDuration(filePath: string): Promise<number>;
    abortFfmpegs(): void;

    renderThumbnail(filePath: string, timestamp: number, signal: AbortSignal): Promise<Uint8Array<ArrayBufferLike>>;
    extractSubtitleTrack(filePath: string, streamId: number): Promise<string>;
    extractSubtitleTrackVtt(filePath: string, streamId: number): Promise<Uint8Array<ArrayBufferLike>>;
    extractWaveform({ filePath, outPath }: { filePath: string, outPath: string }): Promise<void>;
    runFfmpegStartupCheck(): Promise<void>;
    readFileFfprobeMeta(filePath: string): Promise<{ format: FFprobeFormat, streams: (FFprobeStream & { guessedType?: 'dji-gps-srt' | undefined })[], chapters: FFprobeChapter[] }>;
    readFrames({ filePath, from, to, streamIndex }: {
        filePath: string, from?: number | undefined, to?: number | undefined, streamIndex: number,
    }): Promise<Frame[]>;
    setCustomFfPath(path: string | undefined): void;
}