import { container, Lifecycle } from "tsyringe";
import type { ILogger } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
import { HttpMediaSourceStreamFactory } from "lossless-cut-application-electron";

class ConsoleLogger implements ILogger {
    info = (message: string, meta?: Record<string, unknown>) => {
        console.info(message, meta);
    }
    warn = (message: string, meta?: Record<string, unknown>) => {
        console.warn(message, meta);
    }
    error = (message: string, meta?: Record<string, unknown>) => {
        console.error(message, meta);
    }
}

container.register<ILogger>(TOKENS.Logger, {
    useClass: ConsoleLogger,
}, {
    lifecycle: Lifecycle.Singleton,
});

// container.register<IPlatform>(TOKENS.Platform, {
//     useClass: Platform,
// }, {
//     lifecycle: Lifecycle.Transient,
// });

// container.register<IFfmpeg>(TOKENS.Ffmpeg, {
//     useClass: FfmpegExeca,
// }, {
//     lifecycle: Lifecycle.Transient,
// });

container.register(TOKENS.MediaSourceStreamFactory, {
    useClass: HttpMediaSourceStreamFactory,
}, {
    lifecycle: Lifecycle.Transient,
});
