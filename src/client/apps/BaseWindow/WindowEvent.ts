import { BaseWindow } from './BaseWindow';
import { EventEmitter } from 'events';

export declare type IBaseWindowEmitterType =
  | 'exit'
  | 'buttonExit'
  | 'buttonMinimize'
  | 'buttonMaximize'
  | 'buttonRestoreDown'
  | 'move'
  | 'blur'
  | 'focus'
  | 'ready'
  | 'resize'
  | 'stateUpdate';

export declare type KeyboardEmitterType = 'keypress' | 'keydown' | 'keyup';
export interface IBaseWindowEmitter {
  on(event: IBaseWindowEmitterType | '*', listener: (event: WindowEvent) => void): this;
}

export class IBaseWindowEmitter extends EventEmitter {
  constructor(private windows: BaseWindow) {
    super();
  }

  emit(event: IBaseWindowEmitterType): boolean {
    const ev = new WindowEvent(event, this.windows);
    super.emit('*', ev);
    super.emit(event, ev);
    return ev.isDefaultPrevented;
  }
}

export class IBaseWindowKeyboard extends EventEmitter {
  constructor() {
    super();
  }

  emit(event: Event['type'], keyboardEvent: KeyboardEvent): boolean {
    super.emit('*', keyboardEvent);
    return super.emit(event, keyboardEvent);
  }
}

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
