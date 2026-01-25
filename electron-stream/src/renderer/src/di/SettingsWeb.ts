import type { Config, ISettings } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class SettingsWeb implements ISettings {

    apiUrl = 'http://localhost:8080/api';

    async get<T>(key: string): Promise<T | undefined> {
        const res = await fetch(`${this.apiUrl}/get-setting?key=${encodeURIComponent(key)}`);
        if (!res.ok) {
            console.error(`Failed to get setting ${key}: ${res.statusText}`);
            return undefined;
        }
        const data = await res.json();
        return data.value;
    }
    async set<T>(key: string, value: T): Promise<void> {
        const res = await fetch(`${this.apiUrl}/set-setting`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key, value }),
        });
        if (!res.ok) {
            console.error(`Failed to set setting ${key}: ${res.statusText}`);
        }
    }
    async reset(key: string): Promise<void> {
        const res = await fetch(`${this.apiUrl}/reset-setting`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key }),
        });
        if (!res.ok) {
            console.error(`Failed to reset setting ${key}: ${res.statusText}`);
        }
    }
    async getDefaults(): Promise<Config> {
        const res = await fetch(`${this.apiUrl}/get-defaults`);
        if (!res.ok) {
            console.error(`Failed to get default settings: ${res.statusText}`);
            throw new Error('Failed to get default settings');
        }
        const data = await res.json();
        return data.defaults;
    }

}