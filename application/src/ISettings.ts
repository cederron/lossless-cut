import type { Config } from 'lossless-cut-application';

export interface ISettings {
    // getCustomOutDir(): string | undefined;
    // setCustomOutDir(path: string | undefined): void;
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    reset(key: string): Promise<void>;
    getDefaults(): Promise<Config>;
}