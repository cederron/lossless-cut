import { type ISettings, IUtils, TOKENS } from "lossless-cut-application";
import { access, lstat, constants } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { inject, injectable } from "tsyringe";

@injectable()
export class Utils implements IUtils {
    
    settings: ISettings;

    constructor(@inject(TOKENS.Settings) settings: ISettings) {
        this.settings = settings;
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
                this.settings.setCustomOutDir(undefined);
                newCustomOutDir = undefined;
            }
        }

        // if we don't (no longer) have a working dir, and not an main file path, then there's nothing we can do, just return the dir
        if (!newCustomOutDir && !inputPath) return newCustomOutDir;

        const effectiveOutDirPath = this.getOutDir(newCustomOutDir, inputPath);
        const hasDirWriteAccess = effectiveOutDirPath != null && await this.checkDirWriteAccess(effectiveOutDirPath);
        if (!hasDirWriteAccess || simulateMasBuild) {
            if (masMode) {
                const newOutDir = await askForOutDir(effectiveOutDirPath);

                // If user canceled open dialog, refuse to continue, because we will get permission denied error from MAS sandbox
                if (!newOutDir) throw new DirectoryAccessDeclinedError();

                // OK, use the dir that the user gave us access to
                this.settings.setCustomOutDir(newOutDir);
                newCustomOutDir = newOutDir;
            } else {
                errorToast(i18n.t('You have no write access to the directory of this file, please select a custom working dir'));
                this.settings.setCustomOutDir(undefined);
                throw new DirectoryAccessDeclinedError();
            }
        }

        return newCustomOutDir;
    }
}