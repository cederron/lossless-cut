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
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    access(path: string, mode: 'wok' | 'rok' | 'fok'): Promise<void>;
    trashFile(path: string): Promise<void>;
    unlinkWithRetry(path: string, options?: {signal:AbortSignal}): Promise<void>;
}