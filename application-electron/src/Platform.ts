import { app } from "electron";
import { IPlatform } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class Platform implements IPlatform {
    isPackaged = async() => app.isPackaged;
    getPlatform = async() => process.platform;
    getResourcesPath = async() => '';
    isLinux = async() => process.platform === 'linux';
    arch = async(): Promise<string> => process.arch;
    isWindows = async() => process.platform === 'win32';
    isMac = async() => process.platform === 'darwin';
    isDev = async() => {
        return true;
    }
    isMasBuild = async() => process.mas === true;
}