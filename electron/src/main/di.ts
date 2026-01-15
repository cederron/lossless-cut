import { container, Lifecycle } from "tsyringe";
import type { IFfmpeg, IPlatform } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
import { Platform, FfmpegExeca } from "lossless-cut-application-electron";

container.register<IPlatform>(TOKENS.Platform, {
    useClass: Platform,
}, {
    lifecycle: Lifecycle.Singleton,
})

container.register<IFfmpeg>(TOKENS.Ffmpeg, {
    useClass: FfmpegExeca,
}, {
    lifecycle: Lifecycle.Singleton,
})