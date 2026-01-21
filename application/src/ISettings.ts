import type { Config } from 'lossless-cut-application';

export interface ISettings {
    // getCustomOutDir(): string | undefined;
    // setCustomOutDir(path: string | undefined): void;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    reset(key: string): void;
    getDefaults(): Config;
}