// @ts-nocheck
import type { CaptureFormat, DetectedSegment, FFprobeChapter, FFprobeFormat, FFprobeStream, FindKeyframeMode, Frame, IFfmpeg, IMediaSourceInitParams, IRunningProcess, Waveform } from "lossless-cut-application";

export class FfmpegWeb implements IFfmpeg {

    apiUrl = 'http://localhost:8080/api';

    getStreamProcess(params: IMediaSourceInitParams): IRunningProcess {
        throw new Error("Method not implemented.");
    }
    getFfmpegPath(): string { throw new Error("Method not implemented."); };
    async getFfCommandLine(cmd: string, args: readonly string[]): Promise<string> {
        const res = await fetch(`${this.apiUrl}/getFfCommandLine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cmd, args }),
        });
        const data = await res.json();
        return data.commandLine;
    };
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
        
        // Decode base64 string to Uint8Array
        const binaryString = atob(data.buffer);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return {
            ...data,
            buffer: bytes
        } as Waveform;
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
    async runFfmpegConcat({ ffmpegArgs, concatTxt, totalDuration, onProgress }: { ffmpegArgs: string[]; concatTxt: string; totalDuration: number; onProgress: (a: number) => void; }): Promise<void> {
        const res = await fetch(`${this.apiUrl}/runFfmpegConcat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ffmpegArgs, concatTxt, totalDuration }),
        });
        if (!res.ok) {
            throw new Error(`Failed to run ffmpeg concat: ${res.status} ${res.statusText}`);
        }
        if (!res.body) throw new Error('Response body is null');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        if (typeof data.progress === 'number') {
                            onProgress(data.progress);
                        }
                    } catch (e: any) {
                         if (line.includes('"error"')) throw new Error(line); 
                         console.error('Failed to parse progress line', e);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
    async runFfmpegWithProgress({ ffmpegArgs, duration, onProgress }: { ffmpegArgs: string[]; duration?: number | undefined; onProgress: (a: number) => void; }): Promise<void> {
        const res = await fetch(`${this.apiUrl}/runFfmpeg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ffmpegArgs, duration }),
        });

        if (!res.ok) {
            throw new Error(`Failed to run ffmpeg: ${res.status} ${res.statusText}`);
        }

        if (!res.body) throw new Error('Response body is null');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        if (typeof data.progress === 'number') {
                            onProgress(data.progress);
                        }
                    } catch (e: any) {
                         if (line.includes('"error"')) throw new Error(line); 
                         console.error('Failed to parse progress line', e);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
    async getDuration(filePath: string): Promise<number> {
        const res = await fetch(`${this.apiUrl}/getDuration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath }),
        });
        if (!res.ok) {
            throw new Error(`Failed to get duration: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.duration as number;
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
    async readFileFfprobeMeta(filePath: string): Promise<{ format: FFprobeFormat; streams: (FFprobeStream & { guessedType?: "dji-gps-srt" | undefined; })[]; chapters: FFprobeChapter[]; }> {
        const res = await fetch(`${this.apiUrl}/readFileFfprobeMeta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath }),
        });
        if (!res.ok) {
            throw new Error(`Failed to read file ffprobe meta: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.meta;
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
    async getExperimentalArgs(ffmpegExperimental: boolean): Promise<string[]> {
        const res = await fetch(`${this.apiUrl}/getExperimentalArgs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ffmpegExperimental }),
        });
        if (!res.ok) {
            throw new Error(`Failed to get experimental args: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.experimentalArgs as string[];
    }
    async getVideoTimescaleArgs(videoTimebase: number | undefined): Promise<string[]> {
        const res = await fetch(`${this.apiUrl}/getVideoTimescaleArgs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoTimebase }),
        });
        if (!res.ok) {
            throw new Error(`Failed to get video timescale args: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.videoTimescaleArgs as string[];
    }
    isCuttingStart(cutFrom: number): boolean {
        throw new Error("Method not implemented.");
    }
    isCuttingEnd(cutTo: number, fileDuration: number | undefined): boolean {
        throw new Error("Method not implemented.");
    }
    async createChaptersFromSegments({ segmentPaths, chapterNames }: { segmentPaths: string[]; chapterNames?: (string | undefined)[] | undefined; }): Promise<{ start: number; end: number; name: string | undefined; }[] | undefined> {
        const res = await fetch(`${this.apiUrl}/createChaptersFromSegments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ segmentPaths, chapterNames }),
        });
        if (!res.ok) {
            throw new Error(`Failed to create chapters from segments: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.chapters as { start: number; end: number; name: string | undefined; }[] | undefined;
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
    async readKeyframesAroundTime({ filePath, streamIndex, aroundTime, window }: { filePath: string; streamIndex: number; aroundTime: number; window: number; }): Promise<Frame[]> {
        const res = await fetch(`${this.apiUrl}/readKeyframesAroundTime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath, streamIndex, aroundTime, window }),
        });
        if (!res.ok) {
            throw new Error(`Failed to read keyframes around time: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.keyframes as Frame[];
    }
    async findKeyframeAtExactTime(keyframes: Frame[], time: number): Promise<Frame | undefined> {
        const res = await fetch(`${this.apiUrl}/findKeyframeAtExactTime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyframes, time }),
        });
        if (!res.ok) {
            throw new Error(`Failed to find keyframe at exact time: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.keyframe as Frame | undefined;
    }
    async findNextKeyframe(keyframes: Frame[], time: number): Promise<Frame | undefined> {
        const res = await fetch(`${this.apiUrl}/findNextKeyframe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyframes, time }),
        });
        if (!res.ok) {
            throw new Error(`Failed to find next keyframe: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.nextKeyframe as Frame | undefined;
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