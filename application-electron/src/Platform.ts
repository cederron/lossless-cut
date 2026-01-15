import { IPlatform } from "lossless-cut-application";

export class Platform implements IPlatform {
    isLinux = () => process.platform === 'linux';
    arch = () => process.arch;
    isWindows = () => process.platform === 'win32';
    isMac = () => process.platform === 'darwin'
}