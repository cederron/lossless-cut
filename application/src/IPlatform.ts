export interface IPlatform {
    isWindows: () => Promise<boolean>;
    isMac: () => Promise<boolean>;
    isLinux: () => Promise<boolean>;
    arch: () => Promise<string>;
    isDev: () => Promise<boolean>;
    getResourcesPath: () => Promise<string>; // Need to point to ffmpeg binaries in Linux, see getExecaOptions, In electron resolves to 'process.resourcesPath'
    getPlatform: () => Promise<string>;
    isPackaged: () => Promise<boolean>;
    isMasBuild: () => Promise<boolean>;
}