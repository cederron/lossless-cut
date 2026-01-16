export interface ISettings {
    getCustomOutDir(): string | undefined;
    setCustomOutDir(path: string | undefined): void;
}