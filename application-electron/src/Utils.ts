import { DirectoryAccessDeclinedError, FFprobeFormat, Html5ifyMode, type IPlatform, type ISettings, IUtils, MasDirectoryAccessDeclinedError, TOKENS } from "lossless-cut-application";
import { constants, access, readdir, rename, stat, utimes, readFile, writeFile } from "fs/promises";
import path, { basename, dirname, extname, isAbsolute, join, parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inject, injectable } from "tsyringe";
import { parse as parseCue } from "cue-parser";
import mime from 'mime-types';
import type { ICueSheet } from "cue-parser/lib/types.d.ts";
import type { Options } from 'p-retry';
import pRetry from 'p-retry';
import { lstat, mkdir, unlink } from "node:fs/promises";
import { fileTypeFromFile } from 'file-type/node';

@injectable()
export class Utils implements IUtils {

    settings: ISettings;
    platform: IPlatform;
    simulateMasBuild = false;
    html5ifiedPrefix = 'html5ified-';
    html5dummySuffix = 'dummy';

    constructor(
        @inject(TOKENS.Settings) settings: ISettings,
        @inject(TOKENS.Platform) platform: IPlatform,
    ) {
        this.settings = settings;
        this.platform = platform;
    }

    async unlinkWithRetry(path: string, options?: { signal: AbortSignal; }): Promise<void> {
        return this.fsOperationWithRetry(async () => unlink(path), { ...options, onFailedAttempt: ({ attemptNumber, error }) => console.warn('Retrying delete', path, attemptNumber, error.message) });
    }

    async getFileUri(path: string | undefined, cacheBuster: number): Promise<string> {
        if (!path) return ''; // Setting video src="" prevents memory leak in chromium
        const uri = pathToFileURL(path).href;
        // https://github.com/mifi/lossless-cut/issues/1674
        if (cacheBuster !== 0) {
            const qs = new URLSearchParams();
            qs.set('t', String(cacheBuster));
            return `${uri}?${qs.toString()}`;
        }
        return uri;
    }

    async pathExists(path: string) {
        try {
            await access(path, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    getFileDir(filePath?: string) {
        return filePath ? dirname(filePath) : undefined;
    }

    async getOutDir(customOutDir: string | undefined, filePath: string): Promise<string>;
    async getOutDir(customOutDir: string, filePath: undefined): Promise<string>;
    async getOutDir(customOutDir: undefined, filePath: undefined): Promise<undefined>;
    async getOutDir(customOutDir: string | undefined, filePath: string | undefined): Promise<string | undefined>;
    async getOutDir(customOutDir?: string | undefined, filePath?: string | undefined) {
        if (customOutDir != null) return customOutDir;
        if (filePath != null) return this.getFileDir(filePath);
        return undefined;
    }

    async checkDirWriteAccess(dirPath: string) {
        try {
            await access(dirPath, constants.W_OK);
        } catch (err) {
            if (err instanceof Error && 'code' in err) {
                if (err.code === 'EPERM') return false; // Thrown on Mac (MAS build) when user has not yet allowed access
                if (err.code === 'EACCES') return false; // Thrown on Linux when user doesn't have access to output dir
            }
            console.error(err);
        }
        return true;
    }

    async ensureWritableOutDir({ inputPath, outDir }: { inputPath?: string | undefined, outDir: string | undefined }): Promise<string | undefined> {
        // we might need to change the output directory if the user chooses to give us a different one.
        let newCustomOutDir = outDir;

        if (newCustomOutDir) {
            // Reset if working directory doesn't exist anymore
            const customOutDirExists = (await this.pathExists(newCustomOutDir)) && (await lstat(newCustomOutDir)).isDirectory();
            if (!customOutDirExists) {
                this.settings.set('customOutDir', undefined);
                newCustomOutDir = undefined;
            }
        }

        // if we don't (no longer) have a working dir, and not an main file path, then there's nothing we can do, just return the dir
        if (!newCustomOutDir && !inputPath) return newCustomOutDir;

        const effectiveOutDirPath = await this.getOutDir(newCustomOutDir, inputPath);
        const hasDirWriteAccess = effectiveOutDirPath != null && await this.checkDirWriteAccess(effectiveOutDirPath);
        if (!hasDirWriteAccess || this.simulateMasBuild) {
            if (await this.platform.isMasBuild() || this.simulateMasBuild) {
                throw new MasDirectoryAccessDeclinedError();
                // const newOutDir = await askForOutDir(effectiveOutDirPath);

                // // If user canceled open dialog, refuse to continue, because we will get permission denied error from MAS sandbox
                // if (!newOutDir) throw new DirectoryAccessDeclinedError();

                // // OK, use the dir that the user gave us access to
                // this.settings.setCustomOutDir(newOutDir);
                // newCustomOutDir = newOutDir;
            } else {
                // errorToast(i18n.t('You have no write access to the directory of this file, please select a custom working dir'));
                this.settings.set('customOutDir', undefined);
                throw new DirectoryAccessDeclinedError();
            }
        }

        return newCustomOutDir;
    }

    async isFile(path: string): Promise<boolean> {
        try {
            const stats = await lstat(path);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    async isDirectory(path: string): Promise<boolean> {
        try {
            const stats = await lstat(path);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    pathsNames(paths: string[]): string[] {
        return paths.map((p) => {
            return parse(p).name;
        });
    }

    async pathJoin(...paths: string[]): Promise<string> {
        return join(...paths);
    }

    async basename(path: string): Promise<string> {
        return basename(path);
    }

    async dirname(path: string): Promise<string> {
        return dirname(path);
    }

    async pathResolve(...paths: string[]): Promise<string> {
        return resolve(...paths);
    }

    async writeFile(path: string, data: string | Uint8Array): Promise<void> {
        await writeFile(path, data);
    }

    async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
        await mkdir(path, options);
    }

    async access(path: string, mode: 'wok' | 'rok' | 'fok'): Promise<void> {
        let fsMode: number;
        switch (mode) {
            case 'wok':
                fsMode = constants.W_OK;
                break;
            case 'rok':
                fsMode = constants.R_OK;
                break;
            case 'fok':
                fsMode = constants.F_OK;
                break;
            default:
                fsMode = constants.F_OK;
        }
        await access(path, fsMode);
    }

    trashFile(_path: string): Promise<void> {
        throw new Error("Method not implemented.");
        // see tryTrashItem ipcMain handler
    }

    testFailFsOperation = false;

    async fsOperationWithRetry<T>(operation: () => Promise<T>, { signal, retries = 10, minTimeout = 100, maxTimeout = 2000, ...opts }: Options & { retries?: number | undefined, minTimeout?: number | undefined, maxTimeout?: number | undefined } = {}): Promise<T> {
        return pRetry<T>(async () => {
            if (this.testFailFsOperation && Math.random() > 0.3) throw Object.assign(new Error('test delete failure'), { code: 'EPERM' });
            return operation();
        }, {
            retries,
            signal,
            minTimeout,
            maxTimeout,
            // mimic fs.rm `maxRetries` https://nodejs.org/api/fs.html#fspromisesrmpath-options
            shouldRetry: (err) => err instanceof Error && 'code' in err && typeof err.code === 'string' && ['EBUSY', 'EMFILE', 'ENFILE', 'EPERM'].includes(err.code),
            ...opts,
        } as Options);
    }

    utimesWithRetry = async (path: string, atime: number, mtime: number, options?: Options) => this.fsOperationWithRetry(async () => utimes(path, atime, mtime), { ...options, onFailedAttempt: ({ attemptNumber, error }) => console.warn('Retrying utimes', path, attemptNumber, error.message) });


    async transferTimestamps({ inPath, outPath, cutFrom = 0, cutTo: cutToIn, duration = 0, treatInputFileModifiedTimeAsStart, treatOutputFileModifiedTimeAsStart }: {
        inPath: string,
        outPath: string,
        cutFrom?: number | undefined,
        cutTo?: number | undefined,
        duration: number | undefined,
        treatInputFileModifiedTimeAsStart: boolean,
        treatOutputFileModifiedTimeAsStart: boolean | null | undefined,
    }) {
        if (treatOutputFileModifiedTimeAsStart == null) return; // null means time transfer is disabled (use current time);

        const cutTo = cutToIn ?? duration;

        // see https://github.com/mifi/lossless-cut/issues/1017#issuecomment-1049097115
        function calculateTime(fileTime: number) {
            if (treatInputFileModifiedTimeAsStart && treatOutputFileModifiedTimeAsStart) {
                return fileTime + cutFrom;
            }
            if (!treatInputFileModifiedTimeAsStart && !treatOutputFileModifiedTimeAsStart) {
                return fileTime - duration + cutTo;
            }
            if (treatInputFileModifiedTimeAsStart && !treatOutputFileModifiedTimeAsStart) {
                return fileTime + cutTo;
            }
            // if (!treatInputFileModifiedTimeAsStart && treatOutputFileModifiedTimeAsStart) {
            return fileTime - duration + cutFrom;
        }

        try {
            const { atime, mtime } = await stat(inPath);
            await this.utimesWithRetry(outPath, calculateTime((atime.getTime() / 1000)), calculateTime((mtime.getTime() / 1000)));
        } catch (err) {
            console.error('Failed to set output file modified time', err);
        }
    }

    // readFileStats = async (path: string) => stat(path);

    readFileSize = async (path: string) => (await this.readFileStats(path)).size;

    getExtensionForFormat(format: string) {
        const ext = {
            matroska: 'mkv',
            ipod: 'm4a',
            adts: 'aac',
            mpegts: 'ts',
        }[format];

        return ext || format;
    }

    async getOutFileExtension({ isCustomFormatSelected, outFormat, filePath }: {
        isCustomFormatSelected?: boolean, outFormat: string, filePath: string,
    }) {
        if (!isCustomFormatSelected) {
            const inputExt = extname(filePath);
            // QuickTime is quirky about the file extension of mov files (has to be .mov)
            // https://github.com/mifi/lossless-cut/issues/1075#issuecomment-1072084286
            const hasMovIncorrectExtension = outFormat === 'mov' && inputExt.toLowerCase() !== '.mov';

            // OK, just keep the current extension. Because most other players will not care about the extension
            if (!hasMovIncorrectExtension) return inputExt;
        }

        // user is changing format, must update extension too
        return `.${this.getExtensionForFormat(outFormat)}`;
    }

    getFileBaseName(filePath?: string) {
        if (!filePath) return undefined;
        const parsed = parse(filePath);
        return parsed.name;
    }

    getSuffixedFileName = async(filePath: string | undefined, nameSuffix: string) => `${this.getFileBaseName(filePath)}-${nameSuffix}`;


    async getOutPath<T extends string | undefined>(a: { customOutDir?: string | undefined, filePath?: T | undefined, fileName: string }): Promise<T extends string ? string : undefined>;
    async getOutPath({ customOutDir, filePath, fileName }: { customOutDir?: string | undefined, filePath?: string | undefined, fileName: string }) {
        if (filePath == null) return undefined;
        return join(await this.getOutDir(customOutDir, filePath), fileName);
    }

    async getSuffixedOutPath<T extends string | undefined>(a: { customOutDir?: string | undefined, filePath?: T | undefined, nameSuffix: string }): Promise<T extends string ? string : undefined>;
    async getSuffixedOutPath({ customOutDir, filePath, nameSuffix }: { customOutDir?: string | undefined, filePath?: string | undefined, nameSuffix: string }) {
        if (filePath == null) return undefined;
        return this.getOutPath({ customOutDir, filePath, fileName: await this.getSuffixedFileName(filePath, nameSuffix) });
    }

    async getHtml5ifiedPath(cod: string | undefined, fp: string, type: Html5ifyMode) {
        // See also inside ffmpegHtml5ify
        const ext = (await this.platform.isMac() && ['slowest', 'slow', 'slow-audio'].includes(type)) ? 'mp4' : 'mkv';
        return this.getSuffixedOutPath({ customOutDir: cod, filePath: fp, nameSuffix: `${this.html5ifiedPrefix}${type}.${ext}` });
    }

    renameWithRetry(renameFromPath: string, renameToPath: string): Promise<void> {
        return this.fsOperationWithRetry(async () => {
            await rename(renameFromPath, renameToPath);
        }, {
            onFailedAttempt: ({ attemptNumber, error }) => console.warn('Retrying rename', renameFromPath, '->', renameToPath, attemptNumber, error.message),
        });
    }

    readdir(path: string | undefined): Promise<string[]> {
        if (!path) return Promise.resolve([]);
        return readdir(path);
    }

    getMimeExtension(mimeType: string): string | false {
        return mime.extension(mimeType);
    }

    pathNormalize(path: string): string {
        return path.normalize(path);
    }

    pathSep(): string {
        return path.sep;
    }

    pathParsedName(path: string): string {
        return parse(path).name;
    }

    async readFileStats(path: string): Promise<{ size: number; atimeMs: number; mtimeMs: number; ctimeMs: number; birthtimeMs: number; }> {
        const stats = await stat(path);
        return {
            size: stats.size,
            atimeMs: stats.atimeMs,
            mtimeMs: stats.mtimeMs,
            ctimeMs: stats.ctimeMs,
            birthtimeMs: stats.birthtimeMs,
        };
    }

    async determineSourceFileFormat(ffprobeFormatsStr: string | undefined, filePath: string) {
        const ffprobeFormats = (ffprobeFormatsStr || '').split(',').map((str) => str.trim()).filter(Boolean);

        const [firstFfprobeFormat] = ffprobeFormats;

        if (firstFfprobeFormat == null) {
            console.warn('FFprobe returned no formats', ffprobeFormatsStr);
            return undefined;
        }

        console.log('FFprobe detected format(s)', ffprobeFormatsStr);

        // We need to test mp3 first because ffprobe seems to report the wrong format sometimes https://github.com/mifi/lossless-cut/issues/2129
        if (firstFfprobeFormat === 'mp3') {
            // file-type detects it correctly
            const fileTypeResponse = await fileTypeFromFile(filePath);
            if (fileTypeResponse?.mime === 'audio/mpeg') {
                return 'mp2';
            }
        }

        if (ffprobeFormats.length === 1) {
            return firstFfprobeFormat;
        }

        // If ffprobe returned a list of formats, use `file-type` to try to detect more accurately.
        // This should only be the case for matroska (matroska,webm) and mov (mov,mp4,m4a,3gp,3g2,mj2),
        // so if it's another format, then just return the first format from the list.
        // See also `ffmpeg -formats`
        if (!['matroska', 'mov'].includes(firstFfprobeFormat)) {
            console.warn('Unknown ffprobe format list', ffprobeFormats);
            return firstFfprobeFormat;
        }

        const fileTypeResponse = await fileTypeFromFile(filePath);
        if (fileTypeResponse == null) {
            console.warn('file-type failed to detect format, defaulting to first FFprobe detected format', ffprobeFormats);
            return firstFfprobeFormat;
        }

        // https://github.com/sindresorhus/file-type/blob/main/core.js
        // https://www.ftyps.com/
        // https://exiftool.org/TagNames/QuickTime.html
        switch (fileTypeResponse.mime) {
            case 'video/x-matroska': {
                return 'matroska';
            }
            case 'video/webm': {
                return 'webm';
            }
            case 'video/quicktime': {
                return 'mov';
            }
            case 'video/3gpp2': {
                return '3g2';
            }
            case 'video/3gpp': {
                return '3gp';
            }

            // These two cmds produce identical output, so we assume that encoding "ipod" means encoding m4a
            // ffmpeg -i example.aac -c copy OutputFile2.m4a
            // ffmpeg -i example.aac -c copy -f ipod OutputFile.m4a
            // See also https://github.com/mifi/lossless-cut/issues/28
            case 'audio/x-m4a':
            case 'audio/mp4': {
                return 'ipod';
            }
            case 'image/avif':
            case 'image/heif':
            case 'image/heif-sequence':
            case 'image/heic':
            case 'image/heic-sequence':
            case 'video/x-m4v':
            case 'video/mp4':
            case 'image/x-canon-cr3': {
                return 'mp4';
            }

            default: {
                console.warn('file-type returned unknown format', ffprobeFormats, fileTypeResponse.mime);
                return firstFfprobeFormat;
            }
        }
    }

    /**
     * Some of the detected input formats are not the same as the muxer name used for encoding.
     * Therefore we have to map between detected input format and encode format
     * See also ffmpeg -formats
     */
    mapInputToOutputFormat(requestedFormat: string | undefined) {
        // see file aac raw adts.aac
        if (requestedFormat === 'aac') return 'adts';

        return requestedFormat;
    }

    async getDefaultOutFormat({ filePath, fileMeta: { format } }: { filePath: string, fileMeta: { format: Pick<FFprobeFormat, 'format_name'> } }) {
        const assumedFormat = await this.determineSourceFileFormat(format.format_name, filePath);

        return this.mapInputToOutputFormat(assumedFormat);
    }

    readFile(path: string): Promise<Buffer<ArrayBuffer>>;
    readFile(path: string, encoding: string): Promise<string>;
    async readFile(path: string, encoding?: string): Promise<string | Buffer<ArrayBuffer>> {
        if (encoding) {
            // @ts-expect-error encoding type mismatch
            return readFile(path, encoding);
        }
        return readFile(path);
    }

    parseCue(path: string): ICueSheet {
        return parseCue(path);
    }

    async getAppPath(): Promise<string> {
        return process.cwd();
    }

    async resolvePathIfNeeded(path: string): Promise<string> {
        return isAbsolute(path) ? path : resolve(path);
    }
}