import type { LossyMode } from "./types/LossyMode.ts";

export interface IState {
    setDisabledNetworking(value: boolean): void;
    getDisabledNetworking(): boolean;
    setLossyMode(mode: LossyMode | undefined): void;
    getLossyMode(): LossyMode | undefined;
}