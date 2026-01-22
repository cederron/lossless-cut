import type { Html5ifyMode } from "./types/Html5ifyMode.ts";

export interface IUtils {
    getFileUri(path: string | undefined, cacheBuster: number): string;
    ensureWritableOutDir({ inputPath, outDir }: { inputPath?: string | undefined, outDir: string | undefined }): Promise<string | undefined>;
    getOutDir(customOutDir?: string | undefined, filePath?: string | undefined): string | undefined;
    isFile(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;
    pathsNames(paths: string[]): string[];
    pathJoin(...paths: string[]): string;
    basename(path: string): string;
    dirname(path: string): string;
    pathExists(path: string): Promise<boolean>;
    pathResolve(...paths: string[]): string;
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
  isCustomFormatSelected?: boolean, outFormat: string, filePath: string,
}): string;
getSuffixedOutPath<T extends string | undefined>(a: { customOutDir?: string | undefined, filePath?: T | undefined, nameSuffix: string }): T extends string ? string : undefined;
getSuffixedOutPath({ customOutDir, filePath, nameSuffix }: { customOutDir?: string | undefined, filePath?: string | undefined, nameSuffix: string }): string | undefined;
getHtml5ifiedPath(cod: string | undefined, fp: string, type: Html5ifyMode): string;
getSuffixedFileName(filePath: string | undefined, nameSuffix: string): string
getOutPath({ customOutDir, filePath, fileName }: { customOutDir?: string | undefined, filePath?: string | undefined, fileName: string }): string;
renameWithRetry(renameFromPath: string, renameToPath: string): Promise<void>;
getMimeExtension(mimeType: string): string | false;
getFileDir(filePath?: string): string | undefined;
checkDirWriteAccess(dirPath: string): Promise<boolean>;
}