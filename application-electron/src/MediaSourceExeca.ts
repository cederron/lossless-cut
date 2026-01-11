import { execa } from 'execa';
import type { ILogger, IMediaSource, IMediaSourceInitParams } from 'lossless-cut-application';


export class MediaSourceExeca implements IMediaSource {

    abortController: AbortController;
    logger: ILogger;
    enableLog = false;
    encode = true;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    async init(params: IMediaSourceInitParams): Promise<void> {
        this.abortController && this.abortController.abort();
        this.abortController = new AbortController();
        const { videoStreamIndex, audioStreamIndexes, seekTo } = params;
        this.logger.info('Starting preview process', { videoStreamIndex, audioStreamIndexes, seekTo });
    }

    async readChunk(): Promise<Buffer | null> {
        throw new Error('Method not implemented.');
    }

    abort(): void {
        this.abortController && this.abortController.abort();
    }

    protected createMediaSourceProcess(params: IMediaSourceInitParams) {
        
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

        this.logger.info(getFfCommandLine('ffmpeg', args));

        return execa(getFfmpegPath(), args, getExecaOptions({ buffer: false, stderr: enableLog ? 'inherit' : 'pipe' }));
    }
}