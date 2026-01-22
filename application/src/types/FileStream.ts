import type { FFprobeChapter, FFprobeFormat, FFprobeStream } from "../ffprobe.ts";

export type FileFfprobeMeta = Awaited<{ format: FFprobeFormat, streams: (FFprobeStream & { guessedType?: 'dji-gps-srt' | undefined })[], chapters: FFprobeChapter[] }>;
export type FileStream = FileFfprobeMeta['streams'][number];