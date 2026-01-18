import { ISettings } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class Settings implements ISettings {
    getCustomOutDir(): string | undefined {
        throw new Error("Method not implemented.");
    }
    setCustomOutDir(path: string | undefined): void {
        throw new Error("Method not implemented.");
    }

}