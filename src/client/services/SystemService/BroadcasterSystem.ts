import { EventEmitter } from 'events';
import { BaseSystemService } from './BaseSystemService';
import { attachDebugMethod } from '../../essential/requests';

export class Broadcaster extends BaseSystemService {
  private broadcastChannel: BroadcastChannel;
  private origin: string;
  private destroyed = false;
  private eventEmitter = new EventEmitter();

  constructor() {
    super();
    attachDebugMethod('BroadCaster', this);
  }

  start() {
    this.origin = location.origin;
    this.broadcastChannel = new BroadcastChannel('lindows-tab-emitter');
    this.broadcastChannel.addEventListener('message', this.onMessage);
  }

  destroy() {
    this.destroyed = true;
    if (!this.broadcastChannel) return;
    this.broadcastChannel.removeEventListener('message', this.onMessage);
  }

  get ok() {
    return !!this.broadcastChannel;
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
    if (this.destroyed) return;
    if (ev.origin !== this.origin) return;
    const data: any[] = ev.data;
    if (!data) return;
    if (!Array.isArray(data)) return;
    if (!data[0]) return;
    const ee = this.eventEmitter;
    this.eventEmitter.emit.apply(ee, data);
  };
}
