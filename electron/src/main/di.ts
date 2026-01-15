import { container, Lifecycle } from "tsyringe";
import type { IPlatform } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";
import { Platform } from "lossless-cut-application-electron";

container.register<IPlatform>(TOKENS.Platform, {
    useClass: Platform,
    lifecycle: Lifecycle.Singleton,
})