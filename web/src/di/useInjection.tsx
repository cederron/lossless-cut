import { TOKENS } from "lossless-cut-application";
import { container } from "tsyringe";
import { type InjectionToken } from "tsyringe";

type TokenValues = typeof TOKENS[keyof typeof TOKENS];

export function useInjection<T>(token: Exclude<InjectionToken<T>, string> | TokenValues): T {
    return container.resolve<T>(token as InjectionToken<T>);
}