export interface IUtils {
    getFileUri(path: string | undefined, cacheBuster: number): string;
    ensureWritableOutDir({ inputPath, outDir }: { inputPath?: string | undefined, outDir: string | undefined }): Promise<string | undefined>;
}