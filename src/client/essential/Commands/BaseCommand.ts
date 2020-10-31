import { MINUTE } from "../../../shared/constants";
import { Processor } from "../../services/system/ProcessorSystem";
import { FileSystemDirectory } from "../../utils/FileSystemDirectory";

interface CommandParameters {
  [key: number]: string;
}

export interface ExecutionParameters {
  width?: number;
  height?: number;
  processor?: Processor | undefined;
  directory: FileSystemDirectory;
}

export interface BaseCommand {
  /**
   * Will run on command execution if
   * if 0 is return is ok everything else if not ok
   */
  execute(object: ExecutionParameters): number | Promise<number>;
  /**
   * Will run on command execution
   */
  pipe(object: ExecutionParameters): string;
  /**
   * suggest entry in terminal window
   */
  suggest(entry: string, index: number, fullEntry: string, directory?: FileSystemDirectory): string[];
  /**
   * You have to return promise or true to indicate that you will handle
   * with with interrupt command otherwise the object will self destroy.
   * If you pass promise you have up to a minute minute otherwise the object
   * will self destroy for safety reasons
   */
  sigTerm(interruptMessage: InterruptMessage): Promise<void> | boolean;
  /**
   * Will instantly kill. This event tell you that you should instantly clean
   * your task because rest of the object won't available after this one
   */
  sigKill(interruptMessage: InterruptMessage): void;
  /**
   * Keyboard input input event
   */
  sigInt(event: KeyboardEvent): void;
  /**
   * Shows help info
   */
  help: string;
}
export class BaseCommand {
  private _text: string;
  private _args: string[];
  constructor(private _originalText: string, private _data?: string) {
    this._text = _originalText.replace(/  +/g, " ");
    this._args = this._text.split(" ");
  }

  _destructor() {
    const keys = Object.keys(this).filter(d => d !== "destructor");
    for (const dest of keys) {
      delete this[dest];
    }
    delete this["destructor"];
  }

  /**
   * Call this function when you want to update current information
   * @param {string} text
   */
  update(text: string) {
    //do some job I guesS?
  }
  /**
   * Call this function when you want to add info to history
   * @param {string} text
   */
  addHistory(text: string) {
    //do some job I guesS?
  }
  /**
   * Call this function when you to end execution process
   * @param {string} text
   */
  finish(text?: string) {}

  signalKill(text: string) {
    const handleEnd = () => {
      if (this.finish) {
        this.finish(`${this.constructor.name} exited with code SIGKILL`);
      }
      this._destructor();
      return 1;
    };
    if (!this.sigKill) {
      handleEnd();
      return 0;
    } else {
      this._destructor();
      if (this.finish) {
        this.finish(`${this.constructor.name} exited with code SIGKILL`);
        return 1;
      }
    }
  }

  signalInput(event: KeyboardEvent) {
    if (this.signalInput) {
      this.sigInt(event);
    }
  }

  signalTerminate(text: string) {
    const handleEnd = () => {
      if (this.finish) {
        this.finish(`${this.constructor.name} exited with code SIGTERM`);
      }
      this._destructor();
      return;
    };
    if (!this.sigTerm) {
      handleEnd();
      return;
    }
    const handled = this.sigTerm(new InterruptMessage(text, "SIGTERM"));

    if (handled instanceof Promise) {
      const timeout = setTimeout(() => {
        handleEnd();
      }, MINUTE);
      handled.then(() => {
        handleEnd();
        clearTimeout(timeout);
      });

      return;
    } else if (handled === true) {
      handleEnd();
    } else {
      if (this.finish) {
        return this.finish();
      }
      this._destructor();
    }
  }

  get args() {
    return this._args;
  }

  get command() {
    return this._text;
  }

  get originalText() {
    return this._originalText;
  }
  get data() {
    return this._data;
  }
  get commandEntry() {
    const args = [...this.args];
    args.shift();
    return args.join(" ");
  }

  hasArg(value: string, caseIntensive = false) {
    if (caseIntensive) {
      return this._args.find(a => a.toLowerCase() === value.toLowerCase());
    }
    return this._args.find(a => a === value);
  }

  toString() {
    return "[Lindows Command]";
  }
}

export type SIG = "SIGTERM" | "SIGKILL";

export class InterruptMessage {
  private _stack: string;
  constructor(private _message: string, private _sig: SIG) {
    this._stack = new Error().stack;
  }

  get stack() {
    return this._stack;
  }
  get message() {
    return this._message;
  }
  get signal() {
    return this._sig;
  }
}
