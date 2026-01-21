import { TOKENS } from "lossless-cut-application";
import { container } from "tsyringe";
import { type InjectionToken } from "tsyringe";

export function useInjection<T>(token: InjectionToken<T> | typeof TOKENS[keyof typeof TOKENS]): T {
    return container.resolve<T>(token as InjectionToken<T>);
}