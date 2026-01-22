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

    runFfmpegVoid(args: readonly string[]): Promise<void>;
    runFfmpegText(args: readonly string[]): Promise<string>;
    runFfmpegUrl(args: readonly string[], type: string): Promise<string>;

    getExperimentalArgs(ffmpegExperimental: boolean): string[];
    getVideoTimescaleArgs(videoTimebase: number | undefined): string[];

    isCuttingStart(cutFrom: number): boolean;
    isCuttingEnd(cutTo: number, fileDuration: number | undefined): boolean;
    // isDurationValid(duration?: number): duration is number;

    createChaptersFromSegments({ segmentPaths, chapterNames }: { segmentPaths: string[], chapterNames?: (string | undefined)[] | undefined }): Promise<{
        start: number;
        end: number;
        name: string | undefined;
    }[] | undefined>

    runFfprobeText(args: readonly string[], { timeout, logCli}?: { timeout?: number, logCli?: boolean }): Promise<string>;
    downloadMediaUrl(url: string, outPath: string): Promise<void>;
    readFramesAroundTime({ filePath, aroundTime, streamIndex, window }: {
        filePath: string,
        aroundTime: number,
        streamIndex: number,
        window: number,
    }): Promise<Frame[]>;
    findNearestKeyFrameTime({ frames, time, direction, fps }: { frames: Frame[], time: number, direction: number, fps: number | undefined }): number | undefined;
    readKeyframesAroundTime({ filePath, streamIndex, aroundTime, window }: { filePath: string, streamIndex: number, aroundTime: number, window: number }): Promise<Frame[]>;
    findKeyframeAtExactTime(keyframes: Frame[], time: number): Frame | undefined;
    findNextKeyframe(keyframes: Frame[], time: number): Frame | undefined;
}