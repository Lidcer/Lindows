import { EventEmitter } from 'events';

export class Broadcaster extends EventEmitter {
  private broadcastChannel: BroadcastChannel;
  private origin: string;
  private destroyed = false;

  constructor() {
    super();
    this.origin = location.origin;
    try {
      this.broadcastChannel = new BroadcastChannel('LindowsTabEmitter');
      this.broadcastChannel.addEventListener('message', this.onMessage);
    } catch (_) {
      /* ignore */
    }
  }

  get isOk() {
    return !!this.broadcastChannel;
  }

  private onMessage = (ev: MessageEvent) => {
    if (this.destroyed) return;
    if (ev.origin !== this.origin) return;
    const data: any[] = ev.data;
    if (!data) return;
    if (!Array.isArray(data)) return;
    if (!data[0]) return;
    super.emit.apply(this, data);
  };

  emit(event: string | symbol, ...args: any[]): boolean {
    if (!this.broadcastChannel) return;
    args = [...args];
    args.unshift(event);
    this.broadcastChannel.postMessage(args);
    return true;
  }

  destroy() {
    this.destroyed = true;
    if (!this.broadcastChannel) return;
    this.broadcastChannel.removeEventListener('message', this.onMessage);
  }
}
