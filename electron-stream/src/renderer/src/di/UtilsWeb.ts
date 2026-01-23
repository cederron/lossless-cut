// @ts-nocheck

import type { ICueSheet } from "cue-parser/lib/types";
import type { FFprobeFormat, Html5ifyMode, IUtils } from "lossless-cut-application";

export class UtilsWeb implements IUtils {

    apiUrl = 'http://localhost:8080/api';

    getFileUri(path: string | undefined, cacheBuster: number): string {
        throw new Error("Method not implemented.");
    }
    ensureWritableOutDir({ inputPath, outDir }: { inputPath?: string | undefined; outDir: string | undefined; }): Promise<string | undefined> {
        throw new Error("Method not implemented.");
    }
    async getOutDir(customOutDir?: string | undefined, filePath?: string | undefined): Promise<string | undefined> {
        const res = await fetch(`${this.apiUrl}/getOutDir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customOutDir, filePath }),
        });
        const data = await res.json();
        return data.outDir;
    }
    isFile(path: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    isDirectory(path: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    pathsNames(paths: string[]): string[] {
        throw new Error("Method not implemented.");
    }
    async pathJoin(...paths: string[]): Promise<string> {
        const res = await fetch(`${this.apiUrl}/pathJoin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paths }),
        });
        const data = await res.json();
        return data.joinedPath;
    }
    basename(path: string): string {
        throw new Error("Method not implemented.");
    }
    async dirname(path: string): Promise<string> {
        const res = await fetch(`${this.apiUrl}/dirname`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path }),
        });
        const data = await res.json();
        return data.dirName;
    }
    pathExists(path: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    pathResolve(...paths: string[]): string {
        throw new Error("Method not implemented.");
    }
    pathNormalize(path: string): string {
        throw new Error("Method not implemented.");
    }
    pathParsedName(path: string): string {
        throw new Error("Method not implemented.");
    }
    pathSep(): string {
        throw new Error("Method not implemented.");
    }
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    writeFile(path: unknown, data: unknown): Promise<void> {
        throw new Error("Method not implemented.");
    }
    mkdir(path: string, options?: { recursive?: boolean; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    access(path: string, mode: "wok" | "rok" | "fok"): Promise<void> {
        throw new Error("Method not implemented.");
    }
    readdir(path: string | undefined): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    trashFile(path: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    unlinkWithRetry(path: string, options?: { signal: AbortSignal; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async transferTimestamps({ inPath, outPath, cutFrom, cutTo, duration, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart }: { inPath: string; outPath: string; cutFrom?: number | undefined; cutTo?: number | undefined; duration: number | undefined; treatInputFileModifiedTimeAsStart: boolean; treatOutputFileModifiedTimeAsStart: boolean | null | undefined; }): Promise<void> {
        await fetch(`${this.apiUrl}/transferTimestamps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inPath, outPath, cutFrom, cutTo, duration, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart }),
        });
    }
    readFileSize(path: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
    async getOutFileExtension({ isCustomFormatSelected, outFormat, filePath }: { isCustomFormatSelected?: boolean; outFormat: string; filePath: string; }): string {
        const res = await fetch(`${this.apiUrl}/getOutFileExtension`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isCustomFormatSelected, outFormat, filePath }),
        });
        const data = await res.json();
        return data.extension;
    }
    async getSuffixedOutPath<T extends string | undefined>(a: { customOutDir?: string | undefined; filePath?: T | undefined; nameSuffix: string; }): Promise<T extends string ? string : undefined>;
    async getSuffixedOutPath({ customOutDir, filePath, nameSuffix }: { customOutDir?: string | undefined; filePath?: string | undefined; nameSuffix: string; }): Promise<string | undefined>
    {
        const res = await fetch(`${this.apiUrl}/getSuffixedOutPath`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customOutDir, filePath, nameSuffix }),
        });
        const data = await res.json();
        return data.outPath;
    }
    getHtml5ifiedPath(cod: string | undefined, fp: string, type: Html5ifyMode): string {
        throw new Error("Method not implemented.");
    }
    getSuffixedFileName(filePath: string | undefined, nameSuffix: string): string {
        throw new Error("Method not implemented.");
    }
    async getOutPath({ customOutDir, filePath, fileName }: { customOutDir?: string | undefined; filePath?: string | undefined; fileName: string; }): Promise<string> {
        throw new Error("Method not implemented.");
    }
    renameWithRetry(renameFromPath: string, renameToPath: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getMimeExtension(mimeType: string): string | false {
        throw new Error("Method not implemented.");
    }
    getFileDir(filePath?: string): string | undefined {
        throw new Error("Method not implemented.");
    }
    checkDirWriteAccess(dirPath: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    readFileStats(path: string): Promise<{ size: number; atimeMs: number; mtimeMs: number; ctimeMs: number; birthtimeMs: number; }> {
        throw new Error("Method not implemented.");
    }
    getDefaultOutFormat({ filePath, fileMeta: { format } }: { filePath: string; fileMeta: { format: Pick<FFprobeFormat, "format_name">; }; }): Promise<string | undefined> {
        throw new Error("Method not implemented.");
    }
    readFile(path: string): Promise<Buffer<ArrayBuffer>>;
    readFile(path: string, encoding: string): Promise<string>;
    readFile(path: unknown, encoding?: unknown): Promise<string> | Promise<Buffer<ArrayBuffer>> {
        throw new Error("Method not implemented.");
    }
    parseCue(path: string): ICueSheet {
        throw new Error("Method not implemented.");
    }
    
}