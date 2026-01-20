import { container, injectable, Lifecycle } from "tsyringe";
import type { IFfmpeg, ILogger, IPlatform, ISettings } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
import { Platform, FfmpegExeca, ProcessMediaSourceStreamFactory, Settings } from "lossless-cut-application-electron";

@injectable()
class ConsoleLogger implements ILogger {
    info(message: any, ...meta: any[]) {
        console.info(message, ...meta);
    }
    warn(message: any, ...meta: any[]) {
        console.warn(message, ...meta);
    }
    error(message: any, ...meta: any[]) {
        console.error(message, ...meta);
    }
}

container.register<ILogger>(TOKENS.Logger, {
    useClass: ConsoleLogger,
}, {
    lifecycle: Lifecycle.Transient,
});

container.register<IPlatform>(TOKENS.Platform, {
    useClass: Platform,
}, {
    lifecycle: Lifecycle.Transient,
})

container.register<IFfmpeg>(TOKENS.Ffmpeg, {
    useClass: FfmpegExeca,
}, {
    lifecycle: Lifecycle.Transient,
})

container.register(TOKENS.MediaSourceStreamFactory, {
    useClass: ProcessMediaSourceStreamFactory,
    // useClass: HttpMediaSourceStreamFactory,
}, {
    lifecycle: Lifecycle.Transient,
})

container.register<ISettings>(TOKENS.Settings, {
    useClass: Settings,
}, {
    lifecycle: Lifecycle.Singleton,
})