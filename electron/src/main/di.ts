import { container } from "tsyringe";
import type { IPlatform } from "lossless-cut-application";
import { TOKENS } from "lossless-cut-application";

container.register<IPlatform>(TOKENS.Platform, {
    useClass: Platform,
    lifecycle: "singleton",
})