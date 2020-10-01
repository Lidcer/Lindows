import { EventEmitter } from 'events';
import { Processor } from './ProcessorSystem';
import { Fingerpriner } from './FingerprinerSystem';
import { Broadcaster } from './BroadcasterSystem';
import { Network } from './NetworkSystem';
import { BrowserStorage } from './BrowserStorageSystem';
import { Account } from './AccountSystem';

export declare interface IServices {
  on(event: 'onServiceReady', listener: (name: string) => void): this;
  on(event: 'onServiceFailed', listener: (name: string) => void): this;
  on(event: 'allReady', listener: () => void): this;
}

export class IServices extends EventEmitter {
  private _broadcaster: Broadcaster;
  private _storage: BrowserStorage;
  private _account: Account;
  private _network: Network;
  private _processor: Processor;
  private _fingerprinter: Fingerpriner;
 // private _fingerprinter: Notification;
  private isReady = false;

  constructor() {
    super();
  }
  async init() {
    await this.initBroadcaster();
    await this.initBrowserStorage();
    await this.initFingerPrinter();
    await this.initNetwork();
    await this.initAccount();
    await this.initProcessor();

    this.isReady = true;
    this.emit('allReady', this);
  }
  private async initBroadcaster() {
    this._broadcaster = new Broadcaster();
    try {
      await this._broadcaster.start();
      this.emit('onServiceReady', 'Broadcaster');
    } catch (error) {
      this.emit('onServiceFailed', 'Broadcaster');
    }
  }
  private async initBrowserStorage(): Promise<void> {
    this._storage = new BrowserStorage();
    try {
      await this._storage.start();
      this.emit('onServiceReady', 'BrowserStorage');
    } catch (error) {
      this.emit('onServiceFailed', 'BrowserStorage');
    }
  }
  private async initAccount(): Promise<void> {
    this._account = new Account(this._broadcaster, this._network);
    try {
      await this._account.start();
      this.emit('onServiceReady', 'Account');
    } catch (error) {
      this.emit('onServiceFailed', 'Account');
    }
  }

  private async initFingerPrinter(): Promise<void> {
    this._fingerprinter = new Fingerpriner();
    try {
      await this._fingerprinter.start();
      this.emit('onServiceReady', 'Fingerpriner');
    } catch (error) {
      this.emit('onServiceFailed', 'Fingerpriner');
    }
  }

  private async initProcessor(): Promise<void> {
    this._processor = new Processor(this._storage, this._broadcaster);
    try {
      await this._processor.start();
      this.emit('onServiceReady', 'Processor');
    } catch (error) {
      this.emit('onServiceFailed', 'Processor');
    }
  }

  private async initNetwork(): Promise<void> {
    this._network = new Network(this._fingerprinter);
    try {
      await this._network.start();
      this.emit('onServiceReady', 'Network');
    } catch (error) {
      this.emit('onServiceFailed', 'Network');
    }
  }

  get ready() {
    return this.isReady;
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
 
  get network() {
    return this._network;
  }

}

export const services = new IServices();
services.init();
