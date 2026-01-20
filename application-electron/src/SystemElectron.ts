import { type ILogger, type ISystem, TOKENS } from "lossless-cut-application";
import { inject, injectable } from "tsyringe";

@injectable()
export class SystemElectron implements ISystem {
    
    logger: ILogger;

    constructor(@inject(TOKENS.Logger) logger: ILogger) {
        this.logger = logger;
    }
    // setProgressBar(value: number): void {
    //     mainWindow?.setProgressBar(value);
    // }
    
    // sendOsNotification({title, body}: {title: string, body?: string}): void {
    //     if (!Notification.isSupported()) return;
    //     const notification = new Notification({ title, body: body || '' });
    //     notification.on('failed', (_e, error) => this.logger.warn('Notification failed', error as any)); // TODO as any?
    //     notification.show();
    // }

    // quitApp(): void {
    //     // allow HTTP API to respond etc.
    //     timers.setTimeout(1000).then(() => electron.app.quit());
    // }

}