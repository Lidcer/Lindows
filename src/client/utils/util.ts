export function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export class LindowError extends Error {
  private _nativeError: Error;
  private _message: string;
  private _stack: string;

  constructor(arg: Error);
  constructor(arg: string);
  constructor(arg: any) {
    super();
    if (arg instanceof Error) {
      this._nativeError = arg;
      this._message = arg.message;
      this._stack = arg.stack;
    } else if (typeof arg === 'string') {
      this._nativeError = new Error(arg);
      this._message = arg;
      this._stack = this._nativeError.stack;
    } else {
      this._nativeError = new Error('');
      this._message = '';
      this._stack = this._nativeError.stack;
    }
  }

  toString() {
    return 'Lindow error';
  }

  get message() {
    return this._message;
  }
  get stack() {
    return this._stack;
  }
  get nativeError() {
    return this._nativeError;
  }
}

export function removeFromArray<I = any>(array: I[], item: I): boolean {
  const indexOf = array.indexOf(item);

  if (indexOf === -1) {
    return false;
  }

  array.splice(indexOf, 1);
  return true;
}

export function pushUniqToArray<I = any>(array: I[], item: I): boolean {
  const indexOf = array.indexOf(item);

  if (indexOf === -1) {
    array.push(item);
    return true;
  }
  return false;
}
