import { type ISettings } from 'lossless-cut-application';
import { injectable } from 'tsyringe';

@injectable()
export class Settings implements ISettings {
    get<T>(key: string): T | undefined {
        throw new Error('Method not implemented.');
    }
    set<T>(key: string, value: T): void {
        throw new Error('Method not implemented.');
    }
    reset(key: string): void {
        throw new Error('Method not implemented.');
    }

}