import type { KeyboardAction } from "./KeyboardAction.ts";

export interface KeyBinding {
  keys: string,
  action: KeyboardAction,
}