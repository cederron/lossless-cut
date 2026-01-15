import { IPlatform } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class Platform implements IPlatform {
    getResourcesPath = () => '';
    isLinux = () => process.platform === 'linux';
    arch = () => process.arch;
    isWindows = () => process.platform === 'win32';
    isMac = () => process.platform === 'darwin'
    isDev = () => {
        return true;
    }
}