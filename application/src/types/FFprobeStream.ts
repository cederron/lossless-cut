import type { FFprobeChapter, FFprobeFormat, FFprobeStream } from "../ffprobe.ts";

export type LiteFFprobeStream = Pick<FFprobeStream, 'index' | 'codec_type' | 'codec_tag' | 'codec_name' | 'disposition' | 'tags' | 'sample_rate' | 'time_base'>;

export type AllFilesMeta = Record<string, {
  streams: LiteFFprobeStream[];
  format: FFprobeFormat;
  chapters: FFprobeChapter[];
}>

export type CopyfileStreams = {
  path: string;
  streamIds: number[];
}[]
