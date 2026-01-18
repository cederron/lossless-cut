import { container, injectable, Lifecycle } from "tsyringe";
import type { IFfmpeg, ILogger, IPlatform } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
import { Platform, FfmpegExeca, HttpMediaSourceStreamFactory, Utils, State, Settings } from "lossless-cut-application-electron";

@injectable()
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
    // useClass: ProcessMediaSourceStreamFactory,
    useClass: HttpMediaSourceStreamFactory,
}, {
    lifecycle: Lifecycle.Transient,
})

container.register(TOKENS.Utils,{
    useClass: Utils,
}, {
    lifecycle: Lifecycle.Transient,
});

container.register(TOKENS.State, {
    useClass: State,
}, {
    lifecycle: Lifecycle.Singleton,
});

container.register(TOKENS.Settings, {
    useClass: Settings,
}, {
    lifecycle: Lifecycle.Singleton,
});