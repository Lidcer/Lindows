import { EventEmitter } from 'events';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { attachDebugMethod } from '../../essential/requests';

export class Broadcaster extends BaseSystemService {
  private broadcastChannel: BroadcastChannel;
  private origin: string;
  private eventEmitter = new EventEmitter();
  private _status = SystemServiceStatus.Uninitialized

  constructor() {
    super();
    attachDebugMethod('BroadCaster', this);
  }

  init() {
    if (this.status() !== SystemServiceStatus.Uninitialized) throw new Error('Service has already been initialized');
    this._status = SystemServiceStatus.WaitingForStart;

    const start = () => {
      if (this._status !== SystemServiceStatus.WaitingForStart) throw new Error('Service is not in state for start');
      this.origin = location.origin;
      this.broadcastChannel = new BroadcastChannel('lindows-tab-emitter');
      this.broadcastChannel.addEventListener('message', this.onMessage);
      this._status = SystemServiceStatus.Ready;
    }
  
    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error('Service has already been destroyed');
      this._status = SystemServiceStatus.Destroyed;
      if (!this.broadcastChannel) return;
      this.broadcastChannel.removeEventListener('message', this.onMessage);
    }

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    }
  }

  status = () => {
    return this._status;
  }

  on<T = any>(event: string | symbol, listener: (...args: T[]) => void) {
    this.eventEmitter.on(event, listener);
    return this;
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.removeListener(event, listener);
    return this;
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    if (!this.broadcastChannel) return false;
    args.unshift(event);
    this.broadcastChannel.postMessage(args);
    return true;
  }

  private onMessage = (ev: MessageEvent): boolean => {
    if (this.status() === SystemServiceStatus.Destroyed) return;
    if (ev.origin !== this.origin) return;
    const data: any[] = ev.data;
    if (!data) return;
    if (!Array.isArray(data)) return;
    if (!data[0]) return;
    const ee = this.eventEmitter;
    this.eventEmitter.emit.apply(ee, data);
  };
}
