import { container, Lifecycle } from "tsyringe";
import type { IFfmpeg, ILogger } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
// import { HttpMediaSourceStreamFactory } from "lossless-cut-application-electron";
import { HttpMediaSourceStreamFactory } from "lossless-cut-application-electron/HttpMediaSourceStreamFactory";
import { FfmpegWeb } from "./FfmpegWeb";

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

// container.register<IPlatform>(TOKENS.Platform, {
//     useClass: Platform,
// }, {
//     lifecycle: Lifecycle.Transient,
// });

container.register<IFfmpeg>(TOKENS.Ffmpeg, {
    useClass: FfmpegWeb,
}, {
    lifecycle: Lifecycle.Transient,
});

container.register(TOKENS.MediaSourceStreamFactory, {
    useClass: HttpMediaSourceStreamFactory,
}, {
    lifecycle: Lifecycle.Transient,
});
