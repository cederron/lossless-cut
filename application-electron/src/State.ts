import { IState, LossyMode } from "lossless-cut-application";
import { injectable } from "tsyringe";

@injectable()
export class State implements IState {

    private disabledNetworking: boolean = false;
    private lossyMode: LossyMode | undefined = undefined;
    
    setDisabledNetworking(value: boolean): void {
        this.disabledNetworking = value;
    }

    getDisabledNetworking(): boolean {
        return this.disabledNetworking;
    }

    setLossyMode(mode: LossyMode | undefined): void {
        this.lossyMode = mode;
    }
    
    getLossyMode(): LossyMode | undefined {
        return this.lossyMode;
    }
}