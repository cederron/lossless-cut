export interface IPlatform {
    isWindows: () => boolean;
    isMac: () => boolean;
    isLinux: () => boolean;
    arch: () => string;
    isDev: () => boolean;
    getResourcesPath: () => string; // Need to point to ffmpeg binaries in Linux, see getExecaOptions, In electron resolves to 'process.resourcesPath'
    getPlatform: () => string;
    isPackaged: () => boolean;
}