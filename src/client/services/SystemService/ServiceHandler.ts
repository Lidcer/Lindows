import { EventEmitter } from 'events';
import { Processor } from './ProcessorSystem';
import { Fingerpriner } from './FingerprinerSystem';
import { Broadcaster } from './BroadcasterSystem';
import { Network } from './NetworkSystem';
import { BrowserStorage } from './BrowserStorageSystem';
import { Account } from './AccountSystem';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { BaseService } from '../backgroundService/BaseService';
import { attachDebugMethod } from '../../essential/requests';

export declare interface IServices {
  on(event: 'onServiceReady', listener: (name: string) => void): this;
  on(event: 'onServiceFailed', listener: (name: string) => void): this;
  on(event: 'allReady', listener: () => void): this;
}

interface Service<T> {
  internalMethods: {
    start(): void | Promise<void>,
    destroy(): void | Promise<void>,
    status(): SystemServiceStatus;
  }
  service: T
}


export class IServices extends EventEmitter {
  private _broadcaster: Service<Broadcaster>;
  private _storage: Service<BrowserStorage>;
  private _account: Service<Account>;
  private _network: Service<Network>;
  private _processor: Service<Processor>;
  private _fingerprinter: Service<Fingerpriner>;
  private isReady = false;

  constructor() {
    super();
    attachDebugMethod('internal', this);
  }
  private failedServiceInternals() {
    let _status = SystemServiceStatus.Failed;
    const mockInternal: Service<any>['internalMethods'] = {
      start: () => {},
      destroy: () => { _status === SystemServiceStatus.Destroyed},
      status: () => { return _status}
    }
    return mockInternal;
  }

  async init() {
    this._broadcaster = await this.initService(new Broadcaster, 'Broadcaster');
    this._storage = await this.initService(new BrowserStorage(), 'BrowserStorage');
    this._fingerprinter = await this.initService(new Fingerpriner(), 'Fingerpriner');
    this._network = await this.initService(new Network(this.fingerprinter), 'Network');
    this._account = await this.initService(new Account(this.broadcaster, this.network), 'Account');
    this._processor = await this.initService(new Processor(this.browserStorage, this.broadcaster), 'Processor');
    this.isReady = true;
    this.emit('allReady', this);
  }
  private emitServiceStatus(service: Service<any>, serviceName: string) {
    if (!service.internalMethods || service.internalMethods.status() === SystemServiceStatus.Failed) {
      this.emit('onServiceFailed', serviceName);
      return
    }
    this.emit('onServiceReady', serviceName);
  }
  
    private async initService<S extends BaseSystemService>(service: S, name: string) {
  
      const systemService: Service<S> = {
        service,
        internalMethods: this.failedServiceInternals()
    }
     try {
      const internal = systemService.service.init();
      systemService.internalMethods = internal;
      await internal.start();
    } catch (error) {
      DEVELOPMENT && console.error(error);
    }
    
    this.emitServiceStatus(systemService, name)
    return systemService;
  }
  get ready() {
    return this.isReady;
  }

  get processor() {
    return this._processor.service;
  }

  get browserStorage() {
    return this._storage.service;
  }

  get fingerprinter() {
    return this._fingerprinter.service;
  }

  get broadcaster() {
    return this._broadcaster.service;
  }

  get account() {
    return this._account.service;
  }
 
  get network() {
    return this._network.service;
  }

}

export const services = new IServices();
services.init();
