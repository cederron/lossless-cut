import { ISettings } from "lossless-cut-application";
import { injectable } from "tsyringe";
import { app } from "electron";
import fs from "fs";
import path from "path";

@injectable()
export class Settings implements ISettings {
    private settingsPath: string;
    private settings: { customOutDir?: string; [key: string]: any } = {};

    constructor() {
        this.settingsPath = path.join(app.getPath("userData"), "settings.json");
        this.loadSettings();
    }

    private loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, "utf-8");
                this.settings = JSON.parse(data);
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
        }
    }

    private saveSettings() {
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        } catch (err) {
            console.error("Failed to save settings:", err);
        }
    }

    // getCustomOutDir(): string | undefined {
    //     return this.settings.customOutDir;
    // }

    // setCustomOutDir(path: string | undefined): void {
    //     if (path === undefined) {
    //         delete this.settings.customOutDir;
    //     } else {
    //         this.settings.customOutDir = path;
    //     }
    //     this.saveSettings();
    // }

    get<T>(key: string): T | undefined {
        return this.settings[key];
    }

    set<T>(key: string, value: T): void {
        this.settings[key] = value;
        this.saveSettings();
    }

    reset(key: string): void {
        delete this.settings[key];
        this.saveSettings();
    }
}