import { app } from "electron";
import { IPlatform } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class Platform implements IPlatform {
    isPackaged = () => app.isPackaged;
    getPlatform = () => process.platform;
    getResourcesPath = () => '';
    isLinux = () => process.platform === 'linux';
    arch = (): string => process.arch;
    isWindows = () => process.platform === 'win32';
    isMac = () => process.platform === 'darwin'
    isDev = () => {
        return true;
    }
}