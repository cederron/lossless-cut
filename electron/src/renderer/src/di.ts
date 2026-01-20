import { container, Lifecycle } from "tsyringe";
import type { ILogger } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
// import { HttpMediaSourceStreamFactory } from "lossless-cut-application-electron";
// import { HttpMediaSourceStreamFactory } from "lossless-cut-application-electron/HttpMediaSourceStreamFactory";
import { ProcessMediaSourceStreamFactory } from "lossless-cut-application-electron/ProcessMediaSourceStreamFactory";

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

// container.register<IFfmpeg>(TOKENS.Ffmpeg, {
//     useClass: FfmpegExeca,
// }, {
//     lifecycle: Lifecycle.Singleton,
// });

container.register(TOKENS.MediaSourceStreamFactory, {
    useClass: ProcessMediaSourceStreamFactory, // HttpMediaSourceStreamFactory,
}, {
    lifecycle: Lifecycle.Transient,
});

// container.register<IUtils>(TOKENS.Utils, {
//     useClass: Utils,
// }, {
//     lifecycle: Lifecycle.Singleton,
// });
