/**
 * Properties of a source file made available to the user in the export file name template.
 * All times are expressed in milliseconds since the POSIX Epoch.
 */
export interface SourceFile {
  /** The file's name without the file system path. */
  name: string,
  /** The full filesystem path of the file. */
  path: string,
  /** File size in bytes. */
  size?: number | bigint | undefined, // File size in bytes
  /** The last time this file was accessed. */
  atime?: number | undefined,
  /** The last time this file was modified. */
  mtime?: number | undefined,
  /** The last time the file status was changed. */
  ctime?: number | undefined,
  /** The creation time of this file. */
  birthtime?: number | undefined,
}