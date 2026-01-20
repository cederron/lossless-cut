import { container, injectable, Lifecycle } from "tsyringe";
import type { IFfmpeg, ILogger, IPlatform, ISettings, IState, ISystem, IUtils, IMediaSourceStreamFactory } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
import { Platform, FfmpegExeca, HttpMediaSourceStreamFactory, Utils, State, Settings, SystemElectron } from "lossless-cut-application-electron";

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

container.register<IMediaSourceStreamFactory>(TOKENS.MediaSourceStreamFactory, {
    // useClass: ProcessMediaSourceStreamFactory,
    useClass: HttpMediaSourceStreamFactory,
}, {
    lifecycle: Lifecycle.Transient,
})

container.register<IUtils>(TOKENS.Utils,{
    useClass: Utils,
}, {
    lifecycle: Lifecycle.Transient,
});

container.register<IState>(TOKENS.State, {
    useClass: State,
}, {
    lifecycle: Lifecycle.Singleton,
});

container.register<ISettings>(TOKENS.Settings, {
    useClass: Settings,
}, {
    lifecycle: Lifecycle.Transient,
});

container.register<ISystem>(TOKENS.System, {
    useClass: SystemElectron,
}, {
    lifecycle: Lifecycle.Transient,
})