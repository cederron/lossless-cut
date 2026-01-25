import { Config, ISettings, defaults } from "lossless-cut-application";
import { injectable } from "tsyringe";
import { app } from "electron";
import fs from "fs";
import path from "path";

@injectable()
export class Settings implements ISettings {
    private settingsPath: string;
    private settings: { [key: string]: any } = {};

    constructor() {
        this.settingsPath = path.join(app.getPath("userData"), "settings.json");
        this.loadSettings();
    }
    async getDefaults(): Promise<Config> {
        return defaults;
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

    async get<T>(key: string): Promise<T | undefined> {
        return this.settings[key];
    }

    async set<T>(key: string, value: T): Promise<void> {
        this.settings[key] = value;
        this.saveSettings();
    }

    async reset(key: string): Promise<void> {
        delete this.settings[key];
        this.saveSettings();
    }
}
