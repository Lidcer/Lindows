import { Processor } from '../../services/SystemService/ProcessorSystem';
import { FileSystemDirectory } from '../../utils/FileSystemDirectory';

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
   * Will run on command execution
   */
  execute(object: ExecutionParameters): void;

  /**
   * Will stop command execution
   */
  interrupt(interruptMessage: InterruptMessage): void;
  /**
   * Shows help info
   */
  help: string;
}
export class BaseCommand {
  private _text: string;
  private _args: string[];
  constructor(private _originalText: string) {
    this._text = _originalText.replace(/  +/g, ' ');
    this._args = this._text.split(' ');
  }
  /**
   * Call this function when you want to display updated information
   * @param {string} text
   */
  onStatusUpdate(text: string) {
    //do some job I guesS?
  }
  /**
   * Call this function when you want to display updated information
   * @param {string} text
   */
  onFinish(text: string) {}

  async onInterrupt(text: string) {
    this.interrupt(new InterruptMessage(text));
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

  hasArg(value: string, caseIntensive = false) {
    if (caseIntensive) {
      return this._args.find(a => a.toLowerCase() === value.toLowerCase());
    }
    return this._args.find(a => a === value);
  }

  toString() {
    return '[Lindows Command]';
  }
}

export class InterruptMessage {
  private _stack: string;
  constructor(private _message: string) {
    this._stack = new Error().stack;
  }

  get stack() {
    return this._stack;
  }
  get message() {
    return this._message;
  }
}
