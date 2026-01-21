
export type GetFrameCount = (sec: number) => number | undefined;
export type ParseTimecode = (val: string) => number | undefined;
export type FindKeyframeMode = 'nearest' | 'before' | 'after';
