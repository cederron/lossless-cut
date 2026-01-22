import type { SourceFile } from "./SourceFile.ts";

/**
 * The global context made available to the user in the export file name template.
 * See docs/file-name-template.md documentation for details.
 */
export interface FileNameTemplateContext {
  FILENAME: string;
  FILES: SourceFile[];
  SEG_SUFFIX?: string | undefined;
  EXT: string;
  SEG_NUM_INT?: number | undefined;
  SEG_NUM?: string | undefined;
  SELECTED_SEG_NUM_INT?: number | undefined;
  SELECTED_SEG_NUM?: string | undefined;
  SEG_LABEL?: string | string[] | undefined;
  EPOCH_MS: number;
  CUT_FROM?: string | undefined;
  CUT_FROM_NUM?: number | undefined;
  CUT_TO?: string | undefined;
  CUT_TO_NUM?: number | undefined;
  CUT_DURATION?: string | undefined;
  SEG_TAGS?: Record<string, string> | undefined;
  FILE_EXPORT_COUNT?: number | undefined;
  EXPORT_COUNT?: number | undefined;
}