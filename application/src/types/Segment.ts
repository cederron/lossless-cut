/**
 * See https://github.com/mifi/lossless-cut/blob/master/docs/expressions.md
 */
export interface Segment {
  /** Index of the segment in the segment list, starting with 0 */
  index: number,
  /** Name of the segment */
  label: string,
  /** Segment start time in seconds */
  start: number,
  /** Segment end time in seconds, or undefined for markers */
  end?: number | undefined,
  /** Duration in seconds (effectively `end` minus `start` or 0 for markers) */
  duration: number,
  /** Tags associated with this segment */
  tags: Record<string, string>,
}