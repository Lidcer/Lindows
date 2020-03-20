import { EventEmitter } from 'events';
import { IBrowserStorage } from './browserStorage';
import { IProcessor } from './processor';
import { IFingerpriner } from './fingerprinter';
import { Broadcaster } from './broadcaster';
import { IAccount } from './account';

export declare interface IServices {
  on(event: 'onServiceReady', listener: (name: string) => void): this;
  on(event: 'onServiceFailed', listener: (name: string) => void): this;
  on(event: 'allReady', listener: () => void): this;
}

export class IServices extends EventEmitter {
  private _storage: IBrowserStorage;
  private _processor: IProcessor;
  private _fingerprinter: IFingerpriner;
  private _account: IAccount;
  private _broadcaster: Broadcaster;
  private ready = false;

  constructor() {
    super();
    setTimeout(() => {
      this.startup();
    });
  }
  private async startup() {
    await this.initBroadcaster();

    await this.initFingerPrinter();
    this.emit('onServiceReady', 'Fingerprinter');
    await this.initLocalStorage();
    this.emit('onServiceReady', 'LocalStorage');
    await this.initAccount();
    this.emit('onServiceReady', 'Account');
    await this.initProcessor();
    this.emit('onServiceReady', 'Processor');
    this.ready = true;
    this.emit('allReady', this);
  }

  private initFingerPrinter(): Promise<void> {
    return new Promise(resolve => {
      this._fingerprinter = new IFingerpriner();
      this._fingerprinter.on('ready', () => {
        resolve();
      });
    });
  }
  private initLocalStorage(): Promise<void> {
    return new Promise(resolve => {
      this._storage = new IBrowserStorage();
      this._storage.on('ready', () => {
        resolve();
      });
    });
  }

  private initAccount(): Promise<void> {
    return new Promise(resolve => {
      this._account = new IAccount();
      this._account.on('ready', () => {
        resolve();
      });
    });
  }

  private initBroadcaster() {
    this._broadcaster = new Broadcaster();

    if (this._broadcaster.isOk) this.emit('onServiceReady', 'Broadcaster');
    else this.emit('onServiceFailed', 'Broadcaster');
  }
  private initProcessor(): Promise<void> {
    return new Promise(resolve => {
      this._processor = new IProcessor(this._storage, this._broadcaster);
      resolve();
    });
  }

  get isReady() {
    return this.ready;
  }

  get processor() {
    return this._processor;
  }

  get browserStorage() {
    return this._storage;
  }

  get fingerprinter() {
    return this._fingerprinter;
  }

  get broadcaster() {
    return this._broadcaster;
  }

  get account() {
    return this._account;
  }
}

export const services = new IServices();
