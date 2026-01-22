import { execa } from 'execa';
import { CaptureFormat, DetectedSegment, FFprobeProbeResult, type IUtils, TOKENS, UnsupportedFileError, Waveform, type IFfmpeg, type ILogger, type IMediaSourceInitParams, type IPlatform, type IRunningProcess, Frame, FindKeyframeMode } from 'lossless-cut-application';
import type { ExecaError, Options as ExecaOptions, ResultPromise } from 'execa';
import { inject, injectable } from 'tsyringe';
import { join } from 'node:path';
import assert from 'node:assert';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import { clipboard, nativeImage } from 'electron';
import stringToStream from 'string-to-stream';
import invariant from 'tiny-invariant';
import pMap from 'p-map';

// todo this is not a correct assumption
type InvariantExecaError = ExecaError<{ encoding: 'utf8' }> | ExecaError<{ encoding: 'buffer' }>;

@injectable()
export class FfmpegExeca implements IFfmpeg {

    utils: IUtils;
    logger: ILogger;
    enableLog = false;
    encode = true;
    platform: IPlatform;
    customFfPath: string | undefined;
    runningFfmpegs: Set<{
        process: ResultPromise<Omit<ExecaOptions, 'encoding'> & { encoding: 'buffer' }>,
        abortController: AbortController
    }> = new Set();

    constructor(
        @inject(TOKENS.Logger) logger: ILogger,
        @inject(TOKENS.Platform) platform: IPlatform,
        @inject(TOKENS.Utils) utils: IUtils) {
        this.logger = logger;
        this.platform = platform;
        this.utils = utils;
    }

    getStreamProcess(params: IMediaSourceInitParams): IRunningProcess {

        const { path, videoStreamIndex, audioStreamIndexes, seekTo, size, fps, rotate } = params;

        function getFilters() {
            const graph: string[] = [];

            if (videoStreamIndex != null) {
                const videoFilters: string[] = [];
                if (fps != null) videoFilters.push(`fps=${fps}`);
                const scaleFilterOptions: string[] = [];
                if (size != null) scaleFilterOptions.push(`${size}:${size}:flags=lanczos:force_original_aspect_ratio=decrease:force_divisible_by=2`);

                // we need to reduce the color space to bt709 for compatibility with most OS'es and hardware combinations
                // especially because of this bug https://github.com/electron/electron/issues/47947
                // see also https://www.reddit.com/r/ffmpeg/comments/jlk2zn/how_to_encode_using_bt709/
                scaleFilterOptions.push('in_color_matrix=auto:in_range=auto:out_color_matrix=bt709:out_range=tv');
                if (scaleFilterOptions.length > 0) videoFilters.push(`scale=${scaleFilterOptions.join(':')}`);

                // alternatively we could have used `tonemap=hable` instead, but it's slower because it's an additional separate filter.
                // videoFilters.push('tonemap=hable');
                // the best would be to use zscale, but it's not yet available in our ffmpeg build, and I think it's slower.
                // https://gist.github.com/goyuix/033d35846b05733d77f568b754e7c3ea
                // https://superuser.com/questions/1732301/convert-10bit-hdr-video-to-8bit-frames/1732684#1732684

                videoFilters.push(
                    // most compatible pixel format:
                    'format=yuv420p',

                    // setparams is always needed when converting hdr to sdr:
                    'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709',
                );

                const videoFiltersStr = videoFilters.length > 0 ? videoFilters.join(',') : 'null';
                graph.push(`[0:${videoStreamIndex}]${videoFiltersStr}[video]`);
            }

            if (audioStreamIndexes.length > 0) {
                if (audioStreamIndexes.length > 1) {
                    const resampledStr = audioStreamIndexes.map((i) => `[resampled${i}]`).join('');
                    const weightsStr = audioStreamIndexes.map(() => '1').join(' ');
                    graph.push(
                        // First resample because else we get the lowest sample rate
                        ...audioStreamIndexes.map((i) => `[0:${i}]aresample=44100[resampled${i}]`),
                        // now mix all audio channels together
                        `${resampledStr}amix=inputs=${audioStreamIndexes.length}:duration=longest:weights=${weightsStr}:normalize=0:dropout_transition=2[audio]`,
                    );
                } else {
                    graph.push(`[0:${audioStreamIndexes[0]}]anull[audio]`);
                }
            }

            if (graph.length === 0) return [];
            return ['-filter_complex', graph.join(';')];
        }

        const videoEncodeArgs = [
            'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '10',
        ];

        // const videoEncodeArgs = ['h264_videotoolbox', '-b:v', '5M']


        // https://stackoverflow.com/questions/16658873/how-to-minimize-the-delay-in-a-live-streaming-with-ffmpeg
        // https://unix.stackexchange.com/questions/25372/turn-off-buffering-in-pipe
        const args = [
            '-hide_banner',
            ...(this.enableLog ? [] : ['-loglevel', 'error']),

            // https://stackoverflow.com/questions/30868854/flush-latency-issue-with-fragmented-mp4-creation-in-ffmpeg
            '-fflags', '+nobuffer+flush_packets+discardcorrupt',
            '-avioflags', 'direct',
            // '-flags', 'low_delay', // this seems to ironically give a *higher* delay
            '-flush_packets', '1',

            '-ss', String(seekTo),

            ...(rotate != null ? [
                '-display_rotation', '0',
                '-noautorotate',
            ] : []),

            '-i', path,

            '-fps_mode', 'passthrough',

            '-map_metadata', '-1',
            '-map_chapters', '-1',

            ...(this.encode ? [
                ...getFilters(),

                ...(videoStreamIndex != null ? [
                    '-map', '[video]',
                    '-c:v', ...videoEncodeArgs,

                    '-g', '1', // reduces latency and buffering
                ] : ['-vn']),

                ...(audioStreamIndexes.length > 0 ? [
                    '-map', '[audio]',
                    '-ac', '2', '-c:a', 'aac', '-b:a', '128k',
                ] : ['-an']),

                // May alternatively use webm/vp8 https://stackoverflow.com/questions/24152810/encoding-ffmpeg-to-mpeg-dash-or-webm-with-keyframe-clusters-for-mediasource
            ] : [
                '-c', 'copy',
            ]),

            '-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', '-',
        ];

        this.logger.info(this.getFfCommandLine('ffmpeg', args));
        // Cast to unknown then IRunningProcess to bypass strict signal type check (string vs Signals)
        return execa(this.getFfmpegPath(), args, this.getExecaOptions({ buffer: false, stderr: this.enableLog ? 'inherit' : 'pipe' })) as unknown as IRunningProcess;
    }

    private getFfPath(cmd: string): string {
        const exeName = this.platform.isWindows() ? `${cmd}.exe` : cmd;

        if (this.customFfPath) return join(this.customFfPath, exeName);

        if (this.platform.isPackaged()) {
            return join(this.platform.getResourcesPath(), exeName);
        }

        // local dev
        const components = ['ffmpeg', `${this.platform.getPlatform()}-${this.platform.arch()}`];
        if (this.platform.isWindows() || this.platform.isLinux()) components.push('lib');
        components.push(exeName);
        return join(...components);
    }

    /**
    * ⚠️ Do not use directly when running ffmpeg, because we need to add certain options before running, like `LD_LIBRARY_PATH` on linux
    */
    getFfmpegPath(): string {
        return this.getFfPath('ffmpeg');
    }

    private escapeCliArg(arg: string) {
        // todo change String(arg) => arg when ts no-implicit-any is turned on
        if (this.platform.isWindows()) {
            // https://github.com/mifi/lossless-cut/issues/2151
            return /[\s"&<>^|]/.test(arg) ? `"${String(arg).replaceAll('"', '""')}"` : arg;
        }
        return /[^\w-]/.test(arg) ? `'${String(arg).replaceAll("'", '\'"\'"\'')}'` : arg;
    }

    getFfCommandLine(cmd: string, args: readonly string[]): string {
        return `${cmd} ${args.map((arg) => this.escapeCliArg(arg)).join(' ')}`;
    }

    private getExecaOptions({ env, cancelSignal, ...rest }: ExecaOptions = {}) {
        // This is a ugly hack to please execa which expects cancelSignal to be a prototype of AbortSignal
        // however this gets lost during @electron/remote passing
        // https://github.com/sindresorhus/execa/blob/c8cff27a47b6e6f1cfbfec2bf7fa9dcd08cefed1/lib/terminate/cancel.js#L5
        if (cancelSignal != null) Object.setPrototypeOf(cancelSignal, new AbortController().signal);

        const execaOptions: Pick<ExecaOptions, 'env'> & { encoding: 'buffer' } = {
            ...(cancelSignal != null && { cancelSignal }),
            ...rest,
            encoding: 'buffer' as const,
            env: {
                ...env,
                // https://github.com/mifi/lossless-cut/issues/1143#issuecomment-1500883489
                ...(this.platform.isLinux() && !this.platform.isDev() && !this.customFfPath && { LD_LIBRARY_PATH: this.platform.getResourcesPath() }),
            },
        };
        return execaOptions;
    }

    // todo collect warnings from ffmpeg output and show them after export? example: https://github.com/mifi/lossless-cut/issues/1469
    runFfmpegProcess(args: readonly string[], customExecaOptions?: ExecaOptions, additionalOptions?: { logCli?: boolean }) {
        const ffmpegPath = this.getFfmpegPath();
        const { logCli = true } = additionalOptions ?? {};
        if (logCli) this.logger.info(this.getFfCommandLine('ffmpeg', args));

        const abortController = new AbortController();
        const process = execa(ffmpegPath, args, this.getExecaOptions({ ...customExecaOptions, cancelSignal: abortController.signal }));

        const wrapped = { process, abortController };

        (async () => {
            this.runningFfmpegs.add(wrapped);
            try {
                await process;
            } catch {
                // ignored here
            } finally {
                this.runningFfmpegs.delete(wrapped);
            }
        })();
        return process;
    }

    async renderWaveformPng({ filePath, start, duration, resample, color, streamIndex, timeout }: {
        filePath: string,
        start?: number,
        duration?: number,
        resample?: number,
        color: string,
        streamIndex: number,
        timeout?: number,
    }): Promise<Waveform> {
        const args1 = [
            '-hide_banner',
            '-i', filePath,
            '-vn',
            '-map', `0:${streamIndex}`,
            ...(start != null ? ['-ss', String(start)] : []),
            ...(duration != null ? ['-t', String(duration)] : []),
            ...(resample != null ? [
                // the operation is faster if we resample
                // the higher the resample rate, the faster the resample
                // but the slower the showwavespic operation will be...
                // https://github.com/mifi/lossless-cut/issues/260#issuecomment-605603456
                '-c:a', 'pcm_s32le',
                '-ar', String(resample),
            ] : [
                '-c', 'copy',
            ]),
            '-f', 'matroska', // mpegts doesn't support vorbis etc
            '-',
        ];

        const args2 = [
            '-hide_banner',
            '-i', '-',
            '-filter_complex', `showwavespic=s=2000x300:scale=lin:filter=peak:split_channels=1:colors=${color}`,
            '-frames:v', '1',
            '-vcodec', 'png',
            '-f', 'image2',
            '-',
        ];

        this.logger.info(`${this.getFfCommandLine('ffmpeg', args1)} | \n${this.getFfCommandLine('ffmpeg', args2)}`);

        let ps1: ResultPromise<{ encoding: 'buffer' }> | undefined;
        let ps2: ResultPromise<{ encoding: 'buffer' }> | undefined;
        try {
            ps1 = this.runFfmpegProcess(args1, { buffer: false, ...(timeout != null && { timeout }) }, { logCli: false });
            ps2 = this.runFfmpegProcess(args2, timeout != null ? { timeout } : undefined, { logCli: false });
            assert(ps1.stdout != null);
            assert(ps2.stdin != null);
            ps1.stdout.pipe(ps2.stdin);

            const { stdout } = await ps2;

            return {
                buffer: Buffer.from(stdout),
            };
        } catch (err) {
            ps1?.kill();
            ps2?.kill();
            throw err;
        }
    }

    mapTimesToSegments(times: number[], includeLast: boolean) {
        const segments: { start: number, end: number | undefined }[] = [];
        for (let i = 0; i < times.length; i += 1) {
            const start = times[i];
            const end = times[i + 1];
            if (start != null) {
                if (end != null) {
                    segments.push({ start, end });
                } else if (includeLast) {
                    segments.push({ start, end }); // end undefined is allowed (means until end of video)
                }
            }
        }
        return segments;
    }

    getInputSeekArgs = ({ filePath, from, to }: { filePath: string, from?: number | undefined, to?: number | undefined }) => [
        ...(from != null ? ['-ss', from.toFixed(5)] : []),
        '-i', filePath,
        ...(from != null && to != null ? ['-t', (to - from).toFixed(5)] : []),
    ];

    parseFfmpegProgressLine({ line, customMatcher, duration: durationIn }: {
        line: string,
        customMatcher?: ((a: string) => void) | undefined,
        duration: number | undefined,
    }) {
        let match = line.match(/frame=\s*\S+\s+fps=\s*\S+\s+q=\s*\S+\s+(?:size|Lsize)=\s*\S+\s+time=\s*(\S+)\s+/);
        if (!match) {
            // Audio only looks like this: "size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
            match = line.match(/(?:size|Lsize)=\s*\S+\s+time=\s*(\S+)\s+/);
        }
        if (!match) {
            customMatcher?.(line);
            return undefined;
        }

        if (durationIn == null) return undefined;
        const duration = Math.max(0, durationIn);
        if (duration === 0) return undefined;

        const timeStr = match[1];
        // console.log(timeStr);
        const match2 = timeStr!.match(/^(-?)(\d+):(\d+):(\d+)\.(\d+)$/);
        if (!match2) throw new Error(`Invalid time from ffmpeg progress ${timeStr}`);

        const sign = match2[1];

        if (sign === '-') {
            // For some reason, ffmpeg sometimes gives a negative progress, e.g. "-00:00:06.46"
            // let's just ignore those lines
            return undefined;
        }

        const h = parseInt(match2[2]!, 10);
        const m = parseInt(match2[3]!, 10);
        const s = parseInt(match2[4]!, 10);
        const cs = parseInt(match2[5]!, 10);
        const time = (((h * 60) + m) * 60 + s) + cs / 100;
        // console.log(time);

        const progressTime = Math.max(0, time);
        // console.log(progressTime);

        const progress = Math.min(progressTime / duration, 1); // sometimes progressTime will be greater than cutDuration
        return progress;
    }

    handleProgress(
        process: { stderr: Readable | null },
        duration: number | undefined,
        onProgress: (a: number) => void,
        customMatcher?: (a: string) => void,
    ) {
        if (!onProgress) return;
        if (process.stderr == null) return;
        onProgress(0);

        const rl = readline.createInterface({ input: process.stderr });
        rl.on('line', (line) => {
            // console.log('progress', line);

            try {
                const progress = this.parseFfmpegProgressLine({ line, customMatcher, duration });
                if (progress != null) {
                    onProgress(progress);
                }
            } catch (err: any) { // TODO added any
                this.logger.error('Failed to parse ffmpeg progress line:', err instanceof Error ? err.message : err);
            }
        });
    }


    async detectSceneChanges({ filePath, streamId, minChange, onProgress, onSegmentDetected, from, to }: {
        filePath: string,
        streamId: number | undefined
        minChange: number | string,
        onProgress: (p: number) => void,
        onSegmentDetected: (p: DetectedSegment) => void,
        from: number,
        to: number,
    }) {
        const args = [
            '-hide_banner',
            ...this.getInputSeekArgs({ filePath, from, to }),
            '-map', streamId != null ? `0:${streamId}` : 'v:0',
            '-filter:v', `select='gt(scene,${minChange})',metadata=print:file=-:direct=1`, // direct=1 to flush stdout immediately
            '-f', 'null', '-',
        ];
        const process = this.runFfmpegProcess(args, { buffer: false });

        this.handleProgress(process, to - from, onProgress);

        assert(process.stdout != null);
        const rl = readline.createInterface({ input: process.stdout });

        let lastTime: number | undefined;

        rl.on('line', (line) => {
            // eslint-disable-next-line unicorn/better-regex
            const match = line.match(/^frame:\d+\s+pts:\d+\s+pts_time:([\d.]+)/);
            if (!match) return;
            const time = parseFloat(match[1]!);
            if (!Number.isNaN(time)) {
                if (lastTime != null && time > lastTime) {
                    onSegmentDetected({ start: from + lastTime, end: from + time });
                }
                lastTime = time;
            }
        });

        await process;

        return { ffmpegArgs: args };
    }

    getFfmpegJpegQuality(quality: number) {
        // Normal range for JPEG is 2-31 with 31 being the worst quality.
        const qMin = 2;
        const qMax = 31;
        return Math.min(Math.max(qMin, quality, Math.round((1 - quality) * (qMax - qMin) + qMin)), qMax);
    }

    getQualityOpts({ captureFormat, quality }: { captureFormat: CaptureFormat, quality: number }) {
        if (captureFormat === 'jpeg') return ['-q:v', String(this.getFfmpegJpegQuality(quality))];
        if (captureFormat === 'webp') return ['-q:v', String(Math.max(0, Math.min(100, Math.round(quality * 100))))];
        return [];
    }

    getCodecOpts(captureFormat: CaptureFormat) {
        if (captureFormat === 'webp') return ['-c:v', 'libwebp']; // else we get only a single file for webp https://github.com/mifi/lossless-cut/issues/1693
        return [];
    }

    async captureFrames({ from, to, videoPath, outPathTemplate, quality, filter, framePts, onProgress, captureFormat }: {
        from: number,
        to?: number | undefined,
        videoPath: string,
        outPathTemplate: string,
        quality: number,
        filter?: string | undefined,
        framePts?: boolean | undefined,
        onProgress: (p: number) => void,
        captureFormat: CaptureFormat,
    }) {
        const args = [
            '-ss', String(from),
            '-i', videoPath,
            ...(to != null ? ['-t', String(Math.max(0, to - from))] : []),
            ...this.getQualityOpts({ captureFormat, quality }),
            // only apply filter for non-markers
            ...(to == null
                ? [
                    '-frames:v', '1', // for markers, just capture 1 frame
                ] : (
                    // for segments (non markers), apply filter (but only if there is one)
                    filter != null ? [
                        '-vf', filter,
                        // https://superuser.com/questions/1336285/use-ffmpeg-for-thumbnail-selections
                        ...(framePts ? ['-frame_pts', '1'] : []),
                        '-vsync', '0', // else we get a ton of duplicates (thumbnail filter)
                    ] : [])
            ),
            ...this.getCodecOpts(captureFormat),
            '-f', 'image2',
            '-y', outPathTemplate,
        ];

        const process = this.runFfmpegProcess(args, { buffer: false });

        if (to != null) {
            this.handleProgress(process, to - from, onProgress);
        }

        await process;

        onProgress(1);

        return args;
    }

    getCaptureFrameArgs({ timestamp, videoPath, quality }: {
        timestamp: number,
        videoPath: string,
        quality: number,
    }) {
        const ffmpegQuality = this.getFfmpegJpegQuality(quality);
        return [
            '-ss', String(timestamp),
            '-i', videoPath,
            '-frames:v', '1',
            '-q:v', String(ffmpegQuality),
        ];
    }

    async captureFrameToFile({ timestamp, videoPath, outPath, quality }: {
        timestamp: number,
        videoPath: string,
        outPath: string,
        quality: number,
    }) {
        const args = [
            ...this.getCaptureFrameArgs({ timestamp, videoPath, quality }),
            '-y', outPath,
        ];
        await this.runFfmpegProcess(args);
        return args;
    }

    async captureFrameToClipboard({ timestamp, videoPath, quality }: {
        timestamp: number,
        videoPath: string,
        quality: number,
    }) {
        const args = [
            ...this.getCaptureFrameArgs({ timestamp, videoPath, quality }),
            '-c:v', 'mjpeg',
            '-f', 'image2',
            '-',
        ];
        const { stdout } = await this.runFfmpegProcess(args);

        clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(stdout)));
    }

    logStdoutStderr({ stdout, stderr }: { stdout: Uint8Array, stderr: Uint8Array }) {
        if (stdout.length > 0) {
            console.log('%cSTDOUT:', 'color: green; font-weight: bold');
            console.log(new TextDecoder().decode(stdout));
        }
        if (stderr.length > 0) {
            console.log('%cSTDERR:', 'color: blue; font-weight: bold');
            console.log(new TextDecoder().decode(stderr));
        }
    }

    async runFfmpegConcat({ ffmpegArgs, concatTxt, totalDuration, onProgress }: {
        ffmpegArgs: string[], concatTxt: string, totalDuration: number, onProgress: (a: number) => void
    }) {
        const process = this.runFfmpegProcess(ffmpegArgs);

        this.handleProgress(process, totalDuration, onProgress);

        assert(process.stdin != null);
        stringToStream(concatTxt).pipe(process.stdin);
        this.logStdoutStderr(await process);
        // return process;
    }

    async runFfmpegWithProgress({ ffmpegArgs, duration, onProgress }: {
        ffmpegArgs: string[],
        duration?: number | undefined,
        onProgress: (a: number) => void,
    }) {
        const process = this.runFfmpegProcess(ffmpegArgs);
        assert(process.stderr != null);
        this.handleProgress(process, duration, onProgress);
        // return process;
        this.logStdoutStderr(await process);
    }

    getFfprobePath = () => this.getFfPath('ffprobe');

    async runFfprobe(args: readonly string[], { timeout = this.platform.isDev() ? 10000 : 30000, logCli = true } = {}) {
        const ffprobePath = this.getFfprobePath();
        if (logCli) this.logger.info(this.getFfCommandLine('ffprobe', args));
        const ps = execa(ffprobePath, args, this.getExecaOptions());
        const timer = setTimeout(() => {
            this.logger.warn('killing timed out ffprobe');
            ps.kill();
        }, timeout);
        try {
            return await ps;
        } finally {
            clearTimeout(timer);
        }
    }

    async readFormatData(filePath: string) {
        this.logger.info('readFormatData', filePath);

        const { stdout } = await this.runFfprobe([
            '-of', 'json', '-show_format', '-i', filePath, '-hide_banner',
        ]);
        return JSON.parse(new TextDecoder().decode(stdout)).format;
    }

    async getDuration(filePath: string) {
        return parseFloat((await this.readFormatData(filePath)).duration);
    }

    abortFfmpegs() {
        this.logger.info('Aborting', this.runningFfmpegs.size, 'ffmpeg process(es)');
        this.runningFfmpegs.forEach((process) => {
            process.abortController.abort();
        });
    }

    runFfmpeg = async (...args: Parameters<typeof this.runFfmpegProcess>) => this.runFfmpegProcess(...args);
    runFfmpegVoid = async (args: readonly string[]): Promise<void> => {
        await this.runFfmpegProcess(args);
    }
    runFfmpegText = async (args: readonly string[]): Promise<string> => {
        const { stdout } = await this.runFfmpegProcess(args);
        return new TextDecoder().decode(stdout);
    }
    runFfmpegUrl = async (args: readonly string[], type: string): Promise<string> => {
        const { stdout } = await this.runFfmpegProcess(args);
        const blob = new Blob([stdout], { type: type });
        return URL.createObjectURL(blob);
    }

    getExperimentalArgs = (ffmpegExperimental: boolean): string[] => (
        ffmpegExperimental ? ['-strict', 'experimental'] : []
    );

    getVideoTimescaleArgs = (videoTimebase: number | undefined) => (videoTimebase != null ? ['-video_track_timescale', String(videoTimebase)] : []);

    // safeCreateBlob(array: Uint8Array, options?: BlobPropertyBag) {
    //   // if we don't do this when creating a Blob, we get:
    //   // "Failed to construct 'Blob': The provided ArrayBufferView value must not be resizable."
    //   // maybe when moving away from @electron/remote, it's not needed anymore?
    //   // https://stackoverflow.com/a/25255750/6519037
    //   const cloned = new Uint8Array(array);
    //   return new Blob([cloned], options);
    // }

    async renderThumbnail(filePath: string, timestamp: number, signal: AbortSignal) {
        const args = [
            '-ss', String(timestamp),
            '-i', filePath,
            '-vf', 'scale=-2:200',
            '-f', 'image2',
            '-vframes', '1',
            '-q:v', '10',
            '-',
        ];

        const { stdout } = await this.runFfmpeg(args, { cancelSignal: signal }, { logCli: false });

        return stdout;
        // const blob = safeCreateBlob(stdout, { type: 'image/jpeg' });
        // return URL.createObjectURL(blob);
    }

    async extractSubtitleTrack(filePath: string, streamId: number) {
        const args = [
            '-hide_banner',
            '-i', filePath,
            '-map', `0:${streamId}`,
            '-f', 'srt',
            '-',
        ];

        const { stdout } = await this.runFfmpeg(args);
        return new TextDecoder().decode(stdout);
    }

    async extractSubtitleTrackVtt(filePath: string, streamId: number) {
        const args = [
            '-hide_banner',
            '-i', filePath,
            '-map', `0:${streamId}`,
            '-f', 'webvtt',
            '-',
        ];

        const { stdout } = await this.runFfmpeg(args);

        return stdout;

        // const blob = safeCreateBlob(stdout, { type: 'text/vtt' });
        // return URL.createObjectURL(blob);
    }

    async extractWaveform({ filePath, outPath }: { filePath: string, outPath: string }) {
        const numSegs = 10;
        const duration = 60 * 60;
        const maxLen = 0.1;
        const segments = Array.from({ length: numSegs }).fill(undefined).map((_unused, i) => [i * (duration / numSegs), Math.min(duration / numSegs, maxLen)] as const);

        // https://superuser.com/questions/681885/how-can-i-remove-multiple-segments-from-a-video-using-ffmpeg
        let filter = segments.map(([from, len], i) => `[0:a]atrim=start=${from}:end=${from + len},asetpts=PTS-STARTPTS[a${i}]`).join(';');
        filter += ';';
        filter += segments.map((_arr, i) => `[a${i}]`).join('');
        filter += `concat=n=${segments.length}:v=0:a=1[out]`;

        console.time('ffmpeg');
        await this.runFfmpeg([
            '-i',
            filePath,
            '-filter_complex',
            filter,
            '-map',
            '[out]',
            '-f', 'wav',
            '-y',
            outPath,
        ], undefined, { logCli: false });
        console.timeEnd('ffmpeg');
    }

    async runFfmpegStartupCheck() {
        // will throw if exit code != 0
        await this.runFfmpeg(['-hide_banner', '-f', 'lavfi', '-i', 'nullsrc=s=256x256:d=1', '-f', 'null', '-']);
    }

    // We can't use `instanceof ExecaError` because the error has been sent over the main-renderer bridge (@electron/remote)
    // so instead we just check if it has some of execa's specific error properties
    isExecaError(err: unknown): err is InvariantExecaError {
        // https://github.com/sindresorhus/execa/blob/main/docs/api.md#resultfailed
        return err instanceof Error && ('failed' in err && 'shortMessage' in err && 'isForcefullyTerminated' in err);
    }

    async readFileFfprobeMeta(filePath: string) {
        try {
            const { stdout } = await this.runFfprobe([
                '-of', 'json', '-show_chapters', '-show_format', '-show_entries', 'stream', '-i', filePath, '-hide_banner',
            ]);

            let parsedJson: FFprobeProbeResult;
            let decoded: string | undefined;
            try {
                // https://github.com/mifi/lossless-cut/issues/1342
                decoded = new TextDecoder().decode(stdout);
                parsedJson = JSON.parse(decoded);
            } catch {
                console.log('ffprobe stdout:', decoded ?? stdout);
                throw new Error('ffprobe returned malformed data');
            }
            const { format, chapters = [] } = parsedJson;
            invariant(format != null);

            const streams = (parsedJson.streams ?? []).map((s) => {
                if (/DJI_[^/\\]+SRT$/.test(filePath)) {
                    return { ...s, guessedType: 'dji-gps-srt' as const };
                }
                return { ...s, guessedType: undefined };
            });
            return { format, streams, chapters };
        } catch (err: any) {
            if (this.isExecaError(err) && err.code == null && err.exitCode != null) {
                throw new UnsupportedFileError('Unsupported file', { cause: err });
            }
            throw err;
        }
    }

    async readFrames({ filePath, from, to, streamIndex }: {
        filePath: string, from?: number | undefined, to?: number | undefined, streamIndex: number,
    }) {
        const intervalsArgs = from != null && to != null ? ['-read_intervals', `${from}%${to}`] : [];
        const { stdout } = await this.runFfprobe(['-v', 'error', ...intervalsArgs, '-show_packets', '-select_streams', String(streamIndex), '-show_entries', 'packet=pts_time,flags', '-of', 'json', filePath], { logCli: false });
        const packetsFiltered: Frame[] = (JSON.parse(new TextDecoder().decode(stdout)).packets as { flags: string, pts_time: string }[])
            .map((p) => ({
                keyframe: p.flags[0] === 'K',
                time: parseFloat(p.pts_time),
                createdAt: new Date(),
            }))
            .filter((p) => !Number.isNaN(p.time));

        return packetsFiltered.sort((a, b) => a.time - b.time);
    }

    setCustomFfPath(path: string | undefined) {
        this.customFfPath = path;
    }

    isDurationValid = (duration?: number): duration is number => duration != null && Number.isFinite(duration) && duration > 0;


    isCuttingStart(cutFrom: number) {
        return cutFrom > 0;
    }

    isCuttingEnd(cutTo: number, fileDuration: number | undefined) {
        if (!this.isDurationValid(fileDuration)) return true;
        return cutTo < fileDuration;
    }

    async createChaptersFromSegments({ segmentPaths, chapterNames }: { segmentPaths: string[], chapterNames?: (string | undefined)[] | undefined }) {
        if (!chapterNames) return undefined;
        try {
            const durations = await pMap(segmentPaths, (segmentPath) => this.getDuration(segmentPath), { concurrency: 3 });
            let timeAt = 0;
            return durations.map((duration, i) => {
                const ret = { start: timeAt, end: timeAt + duration, name: chapterNames[i] };
                timeAt += duration;
                return ret;
            });
        } catch (err) {
            console.error('Failed to create chapters from segments', err);
            return undefined;
        }
    }

    async runFfprobeText(args: readonly string[], { timeout = this.platform.isDev() ? 10000 : 30000, logCli = true } = {}) {
        const ffprobePath = this.getFfprobePath();
        if (logCli) this.logger.info(this.getFfCommandLine('ffprobe', args));
        const ps = execa(ffprobePath, args, this.getExecaOptions());
        const timer = setTimeout(() => {
            this.logger.warn('killing timed out ffprobe');
            ps.kill();
        }, timeout);
        try {
            const { stdout } = await ps;
            return new TextDecoder().decode(stdout);
        } finally {
            clearTimeout(timer);
        }
    }

    getIntervalAroundTime(time: number, window: number) {
        return {
            from: Math.max(time - window / 2, 0),
            to: time + window / 2,
        };
    }

    async readFramesAroundTime({ filePath, streamIndex, aroundTime, window }: { filePath: string, streamIndex: number, aroundTime: number, window: number }) {
        invariant(aroundTime != null);
        const { from, to } = this.getIntervalAroundTime(aroundTime, window);
        return this.readFrames({ filePath, from, to, streamIndex });
    }

    async downloadMediaUrl(url: string, outPath: string) {
  // User agent taken from https://techblog.willshouse.com/2012/01/03/most-common-user-agents/
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  const args = [
    '-hide_banner', '-loglevel', 'error',
    '-user_agent', userAgent,
    '-i', url,
    '-c', 'copy',
    outPath,
  ];

  await this.runFfmpegVoid(args);
}

findNearestKeyFrameTime({ frames, time, direction, fps }: { frames: Frame[], time: number, direction: number, fps: number | undefined }) {
  const sigma = fps ? (1 / fps) : 0.1;
  const keyframes = frames.filter((f) => f.keyframe && (direction > 0 ? f.time > time + sigma : f.time < time - sigma));
  if (keyframes.length === 0) return undefined;
  const nearestKeyFrame = keyframes.sort((a, b) => (direction > 0 ? a.time - b.time : b.time - a.time))[0];
  if (!nearestKeyFrame) return undefined;
  return nearestKeyFrame.time;
}

async readKeyframesAroundTime({ filePath, streamIndex, aroundTime, window }: { filePath: string, streamIndex: number, aroundTime: number, window: number }) {
  const frames = await this.readFramesAroundTime({ filePath, aroundTime, streamIndex, window });
  return frames.filter((frame) => frame.keyframe);
}

findKeyframeAtExactTime = (keyframes: Frame[], time: number) => keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.000001);
findNextKeyframe = (keyframes: Frame[], time: number) => keyframes.find((keyframe) => keyframe.time >= time); // (assume they are already sorted)

async detectIntervals({ filePath, customArgs, onProgress, onSegmentDetected, from, to, matchLineTokens, boundingMode }: {
  filePath: string,
  customArgs: string[],
  onProgress: (p: number) => void,
  onSegmentDetected: (p: DetectedSegment) => void,
  from: number,
  to: number,
  matchLineTokens: (line: string) => DetectedSegment | undefined,
  boundingMode: boolean,
}) {
  const args = [
    '-hide_banner',
    ...this.getInputSeekArgs({ filePath, from, to }),
    ...customArgs,
    '-f', 'null', '-',
  ];
  const process = this.runFfmpegProcess(args, { buffer: false });

  let lastMidpoint: number | undefined;

  function customMatcher(line: string) {
    const match = matchLineTokens(line);
    if (match == null) return;
    const { start, end } = match;

    if (boundingMode) {
      onSegmentDetected({ start: from + start, end: from + end });
    } else {
      const midpoint = start + ((end - start) / 2);

      onSegmentDetected({ start: from + (lastMidpoint ?? 0), end: from + midpoint });
      lastMidpoint = midpoint;
    }
  }

  this.handleProgress(process, to - from, onProgress, customMatcher);

  await process;

  if (!boundingMode && lastMidpoint != null) {
    onSegmentDetected({
      start: from + lastMidpoint,
      end: to,
    });
  }

  return { ffmpegArgs: args };
}

mapFilterOptions = (options: Record<string, string>) => Object.entries(options).map(([key, value]) => `${key}=${value}`).join(':');



async blackDetect({ filePath, streamId, filterOptions, boundingMode, onProgress, onSegmentDetected, from, to }: {
  filePath: string,
  streamId: number | undefined,
  filterOptions: Record<string, string>,
  boundingMode: boolean,
  onProgress: (p: number) => void,
  onSegmentDetected: (p: DetectedSegment) => void,
  from: number,
  to: number,
}) {
  return this.detectIntervals({
    filePath,
    onProgress,
    onSegmentDetected,
    from,
    to,
    boundingMode,
    matchLineTokens: (line) => {
      // eslint-disable-next-line unicorn/better-regex
      const match = line.match(/^[blackdetect\s*@\s*0x[0-9a-f]+] black_start:([\d\\.]+) black_end:([\d\\.]+) black_duration:[\d\\.]+/);
      if (!match) {
        return undefined;
      }
      const start = parseFloat(match[1]!);
      const end = parseFloat(match[2]!);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return undefined;
      }
      if (start < 0 || end <= 0 || start >= end) {
        return undefined;
      }
      return { start, end };
    },
    customArgs: [
      '-map', streamId != null ? `0:${streamId}` : 'v:0',
      '-filter:v', `blackdetect=${this.mapFilterOptions(filterOptions)}`,
    ],
  });
}

async silenceDetect({ filePath, streamId, filterOptions, boundingMode, onProgress, onSegmentDetected, from, to }: {
  filePath: string,
  streamId: number | undefined,
  filterOptions: Record<string, string>,
  boundingMode: boolean,
  onProgress: (p: number) => void,
  onSegmentDetected: (p: DetectedSegment) => void,
  from: number, to: number,
}) {
  return this.detectIntervals({
    filePath,
    onProgress,
    onSegmentDetected,
    from,
    to,
    boundingMode,
    matchLineTokens: (line) => {
      // eslint-disable-next-line unicorn/better-regex
      const match = line.match(/^[silencedetect\s*@\s*0x[0-9a-f]+] silence_end: ([\d\\.]+)[|\s]+silence_duration: ([\d\\.]+)/);
      if (!match) {
        return undefined;
      }
      const end = parseFloat(match[1]!);
      const silenceDuration = parseFloat(match[2]!);
      if (Number.isNaN(end) || Number.isNaN(silenceDuration)) {
        return undefined;
      }
      const start = end - silenceDuration;
      if (start < 0 || end <= 0 || start >= end) {
        return undefined;
      }
      return { start, end };
    },
    customArgs: [
      '-map', streamId != null ? `0:${streamId}` : 'a:0',
      '-filter:a', `silencedetect=${this.mapFilterOptions(filterOptions)}`,
    ],
  });
}

// findKeyframeAtExactTime = (keyframes: Frame[], time: number) => keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.000001);
// findNextKeyframe = (keyframes: Frame[], time: number) => keyframes.find((keyframe) => keyframe.time >= time); // (assume they are already sorted)
findPreviousKeyframe = (keyframes: Frame[], time: number) => keyframes.findLast((keyframe) => keyframe.time <= time);
findNearestKeyframe = (keyframes: Frame[], time: number) => minBy(keyframes, (keyframe) => Math.abs(keyframe.time - time));


findKeyframe(keyframes: Frame[], time: number, mode: FindKeyframeMode) {
  switch (mode) {
    case 'nearest': {
      return this.findNearestKeyframe(keyframes, time);
    }
    case 'before': {
      return this.findPreviousKeyframe(keyframes, time);
    }
    case 'after': {
      return this.findNextKeyframe(keyframes, time);
    }
    default: {
      return undefined;
    }
  }
}

async findKeyframeNearTime({ filePath, streamIndex, time, mode }: { filePath: string, streamIndex: number, time: number, mode: FindKeyframeMode }) {
  let keyframes = await this.readKeyframesAroundTime({ filePath, streamIndex, aroundTime: time, window: 10 });
  let nearByKeyframe = this.findKeyframe(keyframes, time, mode);

  if (!nearByKeyframe) {
    keyframes = await this.readKeyframesAroundTime({ filePath, streamIndex, aroundTime: time, window: 60 });
    nearByKeyframe = this.findKeyframe(keyframes, time, mode);
  }

  if (!nearByKeyframe) return undefined;
  return nearByKeyframe.time;
}



}