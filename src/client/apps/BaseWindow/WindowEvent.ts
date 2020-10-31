import { BaseWindow } from "./BaseWindow";
import { EventEmitter } from "events";

export declare type IBaseWindowEmitterType =
  | "exit"
  | "buttonExit"
  | "buttonMinimize"
  | "buttonMaximize"
  | "buttonRestoreDown"
  | "move"
  | "blur"
  | "focus"
  | "ready"
  | "resize"
  | "stateUpdate";

export declare type KeyboardEmitterType = "keypress" | "keydown" | "keyup";

export interface IJSONWindowEvent {
  shouldDoDefault: boolean;
  state: any;
  props: any;
  eventName: string;
}

export class WindowEvent {
  private shouldDoDefault = false;

  constructor(readonly eventName: string, private windows: BaseWindow) {}

  public preventDefault() {
    this.shouldDoDefault = true;
    return this;
  }

  get isDefaultPrevented() {
    return this.shouldDoDefault;
  }

  get props() {
    return { ...this.windows.props };
  }

  get state() {
    return { ...this.windows.state };
  }

  get json(): IJSONWindowEvent {
    return {
      shouldDoDefault: this.shouldDoDefault,
      state: this.state,
      props: this.props,
      eventName: this.eventName,
    };
  }

  stringify() {
    return JSON.stringify(this.json);
  }
}
