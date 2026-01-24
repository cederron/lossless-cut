import type { IPlatform } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class PlatformWeb implements IPlatform {
    
    apiUrl = 'http://localhost:8080/api';

    async isWindows() {
        const response = await fetch(`${this.apiUrl}/isWindows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.isWindows as boolean;
    }

    async isMac() {
        const response = await fetch(`${this.apiUrl}/isMac`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.isMac as boolean;
    }
    async isLinux() {
        const response = await fetch(`${this.apiUrl}/isLinux`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.isLinux as boolean;
    }
    async arch() {
        const response = await fetch(`${this.apiUrl}/arch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.arch as string;
    }
    async isDev() {
        const response = await fetch(`${this.apiUrl}/isDev`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.isDev as boolean;
    }
    async getResourcesPath() {
        const response = await fetch(`${this.apiUrl}/getResourcesPath`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.getResourcesPath as string;
    }
    async getPlatform() {
        const response = await fetch(`${this.apiUrl}/getPlatform`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.getPlatform as string;
    }
    async isPackaged() {
        const response = await fetch(`${this.apiUrl}/isPackaged`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.isPackaged as boolean;
    }
    async isMasBuild() {
        const response = await fetch(`${this.apiUrl}/isMasBuild`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        return data.isMasBuild as boolean;
    }

}