import type { IUtils } from "lossless-cut-application";

export class Utils implements IUtils {
    unlinkWithRetry(path: string, options?: { signal: AbortSignal; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getFileUri(path: string | undefined, cacheBuster: number): string {
        throw new Error("Method not implemented.");
    }
    ensureWritableOutDir({ inputPath, outDir }: { inputPath?: string | undefined; outDir: string | undefined; }): Promise<string | undefined> {
        throw new Error("Method not implemented.");
    }
    getOutDir(customOutDir?: string | undefined, filePath?: string | undefined): string | undefined {
        throw new Error("Method not implemented.");
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
    pathJoin(...paths: string[]): string {
        throw new Error("Method not implemented.");
    }
    basename(path: string): string {
        throw new Error("Method not implemented.");
    }
    dirname(path: string): string {
        throw new Error("Method not implemented.");
    }
    pathExists(path: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    pathResolve(...paths: string[]): string {
        throw new Error("Method not implemented.");
    }
    writeFile(path: string, data: string | Uint8Array): Promise<void> {
        throw new Error("Method not implemented.");
    }
    mkdir(path: string, options?: { recursive?: boolean; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    access(path: string, mode: "wok" | "rok" | "fok"): Promise<void> {
        throw new Error("Method not implemented.");
    }
    trashFile(path: string): Promise<void> {
        throw new Error("Method not implemented.");
        // see tryTrashItem ipcMain handler
    }

}