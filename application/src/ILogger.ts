export interface ILogger {
    info(message: string, ...meta: any[]): void;
    info(message: any): void;
    info(infoObject: object): void;
    warn(message: string, ...meta: any[]): void;
    warn(message: any): void;
    warn(infoObject: object): void;
    error(message: string, ...meta: any[]): void;
    error(message: any): void;
    error(infoObject: object): void;
}