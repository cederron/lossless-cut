// export const segmentTagsSchema = z.record(z.string(), z.string());

export type SegmentTags = Record<string, string>;// z.infer<typeof segmentTagsSchema>

export interface SegmentBase {
  start: number,
  end?: number | undefined,
  name?: string | undefined,
}

export interface DefiniteSegmentBase {
  start: number,
  end: number,
}

export interface SegmentColorIndex {
  segColorIndex: number,
}

export interface StateSegment extends SegmentBase, SegmentColorIndex {
  name: string;
  segId: string;
  tags?: SegmentTags | undefined;
  initial?: true,
  selected: boolean,
}

export interface SegmentToExport extends DefiniteSegmentBase {
  originalIndex: number,
  name?: string | undefined;
  tags?: SegmentTags | undefined;
}

export interface InverseCutSegment extends DefiniteSegmentBase {
  segId: string;
}