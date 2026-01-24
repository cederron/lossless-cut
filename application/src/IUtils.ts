import type { FFprobeFormat } from "./ffprobe.ts";
// import type { Html5ifyMode } from "./types/Html5ifyMode.ts";
import type { ICueSheet } from 'cue-parser/lib/types.d.ts';

export interface IUtils {
    getFileUri(path: string | undefined, cacheBuster: number): Promise<string>;
    ensureWritableOutDir({ inputPath, outDir }: { inputPath?: string | undefined, outDir: string | undefined }): Promise<string | undefined>;
    getOutDir(customOutDir?: string | undefined, filePath?: string | undefined): Promise<string | undefined>;
    isFile(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;
    pathsNames(paths: string[]): string[];
    pathJoin(...paths: string[]): Promise<string>;
    basename(path: string): Promise<string>;
    dirname(path: string): Promise<string>;
    pathExists(path: string): Promise<boolean>;
    pathResolve(...paths: string[]): Promise<string>;
    pathNormalize(path: string): string;
    pathParsedName(path: string): string;
    pathSep(): string;
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    access(path: string, mode: 'wok' | 'rok' | 'fok'): Promise<void>;
    readdir(path: string | undefined): Promise<string[]>;
    trashFile(path: string): Promise<void>;
    unlinkWithRetry(path: string, options?: {signal:AbortSignal}): Promise<void>;
    transferTimestamps({ inPath, outPath, cutFrom, cutTo, duration, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart }: {
  inPath: string,
  outPath: string,
  cutFrom?: number | undefined,
  cutTo?: number | undefined,
  duration: number | undefined,
  treatInputFileModifiedTimeAsStart: boolean,
  treatOutputFileModifiedTimeAsStart: boolean | null | undefined,
}): Promise<void>;
readFileSize(path: string): Promise<number>;
getOutFileExtension({ isCustomFormatSelected, outFormat, filePath }: {
  isCustomFormatSelected?: boolean | undefined, outFormat: string, filePath: string,
}): Promise<string>;
getSuffixedOutPath<T extends string | undefined>(a: { customOutDir?: string | undefined, filePath?: T | undefined, nameSuffix: string }): Promise<T extends string ? string : undefined>;
getSuffixedOutPath({ customOutDir, filePath, nameSuffix }: { customOutDir?: string | undefined, filePath?: string | undefined, nameSuffix: string }): Promise<string | undefined>;
// TODO remove implementation
// getHtml5ifiedPath(cod: string | undefined, fp: string, type: Html5ifyMode): Promise<string>;
getSuffixedFileName(filePath: string | undefined, nameSuffix: string): Promise<string>
getOutPath({ customOutDir, filePath, fileName }: { customOutDir?: string | undefined, filePath?: string | undefined, fileName: string }): Promise<string>;
renameWithRetry(renameFromPath: string, renameToPath: string): Promise<void>;
getMimeExtension(mimeType: string): string | false;
getFileDir(filePath?: string): string | undefined;
checkDirWriteAccess(dirPath: string): Promise<boolean>;
readFileStats(path: string): Promise<{ size: number, atimeMs: number, mtimeMs: number, ctimeMs: number, birthtimeMs: number }>;
getDefaultOutFormat({ filePath, fileMeta: { format } }: { filePath: string, fileMeta: { format: Pick<FFprobeFormat, 'format_name'> } }): Promise<string | undefined>;
    readFile(path: string): Promise<Buffer<ArrayBuffer>>;
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    parseCue(path:string): ICueSheet;
    // renderThumbnails({ filePath, from, duration, onThumbnail, signal }: {
    //   filePath: string,
    //   from: number,
    //   duration: number,
    //   onThumbnail: (a: { time: number, url: string }) => void,
    //   signal: AbortSignal,
    // }): Promise<void>;
    getAppPath(): Promise<string>;
    resolvePathIfNeeded(path: string): Promise<string>;
    havePermissionToReadFile(filePath: string): Promise<boolean>;
    getPathReadAccessError(pathIn: string): Promise<string | undefined>;
    utimesWithRetry(path: string, atime: number, mtime: number, options?: {signal:AbortSignal}): Promise<void>;
    readDirRecursively(dirPath: string): Promise<string[]>;
}