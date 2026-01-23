// @ts-nocheck
import type { CaptureFormat, DetectedSegment, FFprobeChapter, FFprobeFormat, FFprobeStream, FindKeyframeMode, Frame, IFfmpeg, IMediaSourceInitParams, IRunningProcess, Waveform } from "lossless-cut-application";

export class FfmpegWeb implements IFfmpeg {

    apiUrl = 'http://localhost:8080/api';

    getStreamProcess(params: IMediaSourceInitParams): IRunningProcess {
        throw new Error("Method not implemented.");
    }
    getFfmpegPath(): string { throw new Error("Method not implemented."); };
    getFfCommandLine(cmd: string, args: readonly string[]): string{ throw new Error("Method not implemented."); }; ;
    async renderWaveformPng({ filePath, start, duration, resample, color, streamIndex, timeout }: { filePath: string; start?: number; duration?: number; resample?: number; color: string; streamIndex: number; timeout?: number; }): Promise<Waveform> {
        const res = await fetch(`${this.apiUrl}/renderWaveformPng`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath, start, duration, resample, color, streamIndex, timeout }),
        });
        if (!res.ok) {
            throw new Error(`Failed to render waveform PNG: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data as Waveform;
    }
    mapTimesToSegments(times: number[], includeLast: boolean): { start: number; end: number | undefined; }[] {
        throw new Error("Method not implemented.");
    }
    detectSceneChanges({ filePath, streamId, minChange, onProgress, onSegmentDetected, from, to }: { filePath: string; streamId: number | undefined; minChange: number | string; onProgress: (p: number) => void; onSegmentDetected: (p: DetectedSegment) => void; from: number; to: number; }): Promise<{ ffmpegArgs: string[]; }> {
        throw new Error("Method not implemented.");
    }
    captureFrames({ from, to, videoPath, outPathTemplate, quality, filter, framePts, onProgress, captureFormat }: { from: number; to?: number | undefined; videoPath: string; outPathTemplate: string; quality: number; filter?: string | undefined; framePts?: boolean | undefined; onProgress: (p: number) => void; captureFormat: CaptureFormat; }): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    captureFrameToFile({ timestamp, videoPath, outPath, quality }: { timestamp: number; videoPath: string; outPath: string; quality: number; }): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    captureFrameToClipboard({ timestamp, videoPath, quality }: { timestamp: number; videoPath: string; quality: number; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    runFfmpegConcat({ ffmpegArgs, concatTxt, totalDuration, onProgress }: { ffmpegArgs: string[]; concatTxt: string; totalDuration: number; onProgress: (a: number) => void; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    runFfmpegWithProgress({ ffmpegArgs, duration, onProgress }: { ffmpegArgs: string[]; duration?: number | undefined; onProgress: (a: number) => void; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getDuration(filePath: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
    abortFfmpegs(): void {
        throw new Error("Method not implemented.");
    }
    renderThumbnail(filePath: string, timestamp: number, signal: AbortSignal): Promise<Uint8Array<ArrayBufferLike>> {
        throw new Error("Method not implemented.");
    }
    extractSubtitleTrack(filePath: string, streamId: number): Promise<string> {
        throw new Error("Method not implemented.");
    }
    extractSubtitleTrackVtt(filePath: string, streamId: number): Promise<Uint8Array<ArrayBufferLike>> {
        throw new Error("Method not implemented.");
    }
    extractWaveform({ filePath, outPath }: { filePath: string; outPath: string; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    runFfmpegStartupCheck(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    readFileFfprobeMeta(filePath: string): Promise<{ format: FFprobeFormat; streams: (FFprobeStream & { guessedType?: "dji-gps-srt" | undefined; })[]; chapters: FFprobeChapter[]; }> {
        throw new Error("Method not implemented.");
    }
    async readFrames({ filePath, from, to, streamIndex }: { filePath: string; from?: number | undefined; to?: number | undefined; streamIndex: number; }): Promise<Frame[]> {
        const res = await fetch(`${this.apiUrl}/readFrames`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath, from, to, streamIndex }),
        });
        if (!res.ok) {
            throw new Error(`Failed to read frames: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.frames as Frame[];
    }
    setCustomFfPath(path: string | undefined): void {
        throw new Error("Method not implemented.");
    }
    runFfmpegVoid(args: readonly string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    runFfmpegText(args: readonly string[]): Promise<string> {
        throw new Error("Method not implemented.");
    }
    runFfmpegUrl(args: readonly string[], type: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getExperimentalArgs(ffmpegExperimental: boolean): string[] {
        throw new Error("Method not implemented.");
    }
    getVideoTimescaleArgs(videoTimebase: number | undefined): string[] {
        throw new Error("Method not implemented.");
    }
    isCuttingStart(cutFrom: number): boolean {
        throw new Error("Method not implemented.");
    }
    isCuttingEnd(cutTo: number, fileDuration: number | undefined): boolean {
        throw new Error("Method not implemented.");
    }
    createChaptersFromSegments({ segmentPaths, chapterNames }: { segmentPaths: string[]; chapterNames?: (string | undefined)[] | undefined; }): Promise<{ start: number; end: number; name: string | undefined; }[] | undefined> {
        throw new Error("Method not implemented.");
    }
    runFfprobeText(args: readonly string[], { timeout, logCli }?: { timeout?: number; logCli?: boolean; }): Promise<string> {
        throw new Error("Method not implemented.");
    }
    downloadMediaUrl(url: string, outPath: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async readFramesAroundTime({ filePath, aroundTime, streamIndex, window }: { filePath: string; aroundTime: number; streamIndex: number; window: number; }): Promise<Frame[]> {
        const res = await fetch(`${this.apiUrl}/readFramesAroundTime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath, aroundTime, streamIndex, window }),
        });
        if (!res.ok) {
            throw new Error(`Failed to read frames around time: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.frames as Frame[];
    }
    async findNearestKeyFrameTime({ frames, time, direction, fps }: { frames: Frame[]; time: number; direction: number; fps: number | undefined; }): Promise<number | undefined> {
        const res = await fetch(`${this.apiUrl}/findNearestKeyFrameTime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ frames, time, direction, fps }),
        });
        if (!res.ok) {
            throw new Error(`Failed to find nearest keyframe time: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.nearestTime as number | undefined;
    }
    readKeyframesAroundTime({ filePath, streamIndex, aroundTime, window }: { filePath: string; streamIndex: number; aroundTime: number; window: number; }): Promise<Frame[]> {
        throw new Error("Method not implemented.");
    }
    findKeyframeAtExactTime(keyframes: Frame[], time: number): Frame | undefined {
        throw new Error("Method not implemented.");
    }
    findNextKeyframe(keyframes: Frame[], time: number): Frame | undefined {
        throw new Error("Method not implemented.");
    }
    blackDetect({ filePath, streamId, filterOptions, boundingMode, onProgress, onSegmentDetected, from, to }: { filePath: string; streamId: number | undefined; filterOptions: Record<string, string>; boundingMode: boolean; onProgress: (p: number) => void; onSegmentDetected: (p: DetectedSegment) => void; from: number; to: number; }): Promise<{ ffmpegArgs: string[]; }> {
        throw new Error("Method not implemented.");
    }
    silenceDetect({ filePath, streamId, filterOptions, boundingMode, onProgress, onSegmentDetected, from, to }: { filePath: string; streamId: number | undefined; filterOptions: Record<string, string>; boundingMode: boolean; onProgress: (p: number) => void; onSegmentDetected: (p: DetectedSegment) => void; from: number; to: number; }): Promise<{ ffmpegArgs: string[]; }> {
        throw new Error("Method not implemented.");
    }
    findKeyframeNearTime({ filePath, streamIndex, time, mode }: { filePath: string; streamIndex: number; time: number; mode: FindKeyframeMode; }): Promise<number | undefined> {
        throw new Error("Method not implemented.");
    }
    getStreamFps(stream: FFprobeStream): number | undefined {
        throw new Error("Method not implemented.");
    }
    
}