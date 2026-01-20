import { DirectoryAccessDeclinedError, type IPlatform, type ISettings, IUtils, MasDirectoryAccessDeclinedError, TOKENS } from "lossless-cut-application";
import { access, lstat, constants, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, join, parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inject, injectable } from "tsyringe";

@injectable()
export class Utils implements IUtils {
    
    settings: ISettings;
    platform: IPlatform;
    simulateMasBuild = false;

    constructor(
        @inject(TOKENS.Settings) settings: ISettings,
        @inject(TOKENS.Platform) platform: IPlatform,
    ) {
        this.settings = settings;
        this.platform = platform;
    }

    getFileUri(path: string | undefined, cacheBuster: number): string {
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

    getOutDir(customOutDir: string | undefined, filePath: string): string;
    getOutDir(customOutDir: string, filePath: undefined): string;
    getOutDir(customOutDir: undefined, filePath: undefined): undefined;
    getOutDir(customOutDir: string | undefined, filePath: string | undefined): string | undefined;
    getOutDir(customOutDir?: string | undefined, filePath?: string | undefined) {
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

        const effectiveOutDirPath = this.getOutDir(newCustomOutDir, inputPath);
        const hasDirWriteAccess = effectiveOutDirPath != null && await this.checkDirWriteAccess(effectiveOutDirPath);
        if (!hasDirWriteAccess || this.simulateMasBuild) {
            if (this.platform.isMasBuild() || this.simulateMasBuild) {
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

    pathJoin(...paths: string[]): string {
        return join(...paths);
    }

    basename(path: string): string {
        return basename(path);
    }

    dirname(path: string): string {
        return dirname(path);
    }

    pathResolve(...paths: string[]): string {
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
}