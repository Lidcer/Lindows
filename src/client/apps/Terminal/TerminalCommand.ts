import { IWindow, IBounds, BaseWindow } from '../BaseWindow/BaseWindow';

import { random } from 'lodash';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface TerminalCommand {
  onChange(result: JSX.Element | string);
  onFinish(result: JSX.Element | string);
  onInterrupt();
}

export class TerminalCommand {
  private _content: JSX.Element | string;
  private _command: string;
  private _args: string[];
  private _iWindow: IWindow;
  private _IBounds: IBounds;
  pr;
  private destroyed = false;

  constructor(entry?: string, window?: IWindow, bounds?: IBounds, iTerminal?: BaseWindow) {
    if (window) this._iWindow = { ...window };
    if (bounds) this._IBounds = { ...bounds };
    if (iTerminal) this[random(0, 9999)] = iTerminal;

    if (!entry) return;
    this._args = entry.replace(/ \s/g, '').split(' ');
    this._command = this._args.shift();
  }

  set content(string: JSX.Element | string) {
    if (this.destroyed) return;
    this._content = string;
    if (this.onChange) this.onChange(this._content);
  }

  get content() {
    return this._content;
  }

  get args() {
    return this._args;
  }

  get command() {
    return this._command;
  }

  get window() {
    return this._iWindow;
  }

  get bounds() {
    return this._IBounds;
  }

  set _bounds(bounds: IBounds) {
    this._IBounds = { ...bounds };
  }

  set _window(window: IWindow) {
    this._iWindow = { ...window };
  }

  isArg(arg: string): boolean {
    return this._args.map(e => e.toLowerCase()).includes(arg.toLowerCase());
  }

  finish() {
    if (this.onFinish) this.onFinish(this._content);
    this.destroyed = true;
  }

  interrupt() {
    if (this.onInterrupt) {
      this.onInterrupt();
    }
    this.destroyed = true;
  }
}
