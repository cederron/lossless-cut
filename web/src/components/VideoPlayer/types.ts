
import { z } from 'zod';

export type GetFrameCount = (sec: number) => number | undefined;
export type ParseTimecode = (val: string) => number | undefined;
export type FindKeyframeMode = 'nearest' | 'before' | 'after';
export type ExportMode = 'segments_to_chapters' | 'merge' | 'merge+separate' | 'separate';
export type KeyboardLayoutMap = Map<string, string>;
export interface SegmentColorIndex {
  segColorIndex: number,
}
export interface WaveformBase {
  createdAt: Date,
}

export interface WaveformSlice extends WaveformBase {
  from: number,
  to: number,
  duration: number,
  url?: string, // undefined while rendering
}

export interface OverviewWaveform extends WaveformBase {
  url: string,
}

export interface ChromiumHTMLVideoElement extends HTMLVideoElement {
  videoTracks?: { id: string, selected: boolean }[]
}
export interface ChromiumHTMLAudioElement extends HTMLAudioElement {
  audioTracks?: { id: string, enabled: boolean }[]
}

export type CustomTagsByFile = Record<string, Record<string, string>>;

export interface StreamParams {
  customTags?: Record<string, string>,
  disposition?: string,
  bsfH264Mp4toannexb?: boolean,
  bsfHevcMp4toannexb?: boolean,
  bsfHevcAudInsert?: boolean,
  tag?: string | undefined,
}

export type ParamsByStreamId = Map<string, Map<number, StreamParams>>;

export const deleteDispositionValue = 'llc_disposition_remove';

export type FormatTimecode = (a: { seconds: number, shorten?: boolean | undefined, fileNameFriendly?: boolean | undefined }) => string;

export const segmentTagsSchema = z.record(z.string(), z.string());


