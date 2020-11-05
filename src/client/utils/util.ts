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
    } else if (typeof arg === "string") {
      this._nativeError = new Error(arg);
      this._message = arg;
      this._stack = this._nativeError.stack;
    } else {
      this._nativeError = new Error("");
      this._message = "";
      this._stack = this._nativeError.stack;
    }
  }

  toString() {
    return "Lindow error";
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

export function createKeyboardEvent(key: string, type = "keyup", ctrlKey = false, altKey = false) {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: false,
    ctrlKey,
    altKey,
    key,
  });
}
