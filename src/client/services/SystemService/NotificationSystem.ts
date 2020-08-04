import { EventEmitter } from 'events';
import { BaseSystemService } from './BaseSystemService';
import { BrowserStorage } from './BrowserStorageSystem';
import { attachDebugMethod } from '../../essential/requests';

export interface INotification {
  icon?: string;
  title: string;
  content?: string;
  sender: string;
  block: () => void;
}

export class NotificationSystem extends BaseSystemService {
  private SERVICE_NAME = '__notification__';
  private eventEmitter = new EventEmitter();
  private blocks: string[] = [];

  constructor(private browserStorage: BrowserStorage) {
    super();
    attachDebugMethod('NotificationSystem', this);
  }

  start = () => {
    this.actualStart();
  };

  destroy() {
    this.emit('destroy');
    this.eventEmitter.removeAllListeners();
  }

  actualStart = async () => {
    this.blocks = this.browserStorage.getItem(this.SERVICE_NAME) || [];
  };

  on(event: 'destroy', listener: () => void): void;
  on(event: 'notification', listener: (notification: INotification) => void): void;
  on(event: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.removeListener(event, listener);
  }
  private emit(event: 'destroy'): void;
  private emit(event: 'notification', notification: INotification): void;
  private emit(event: string | symbol, ...args: any[]) {
    this.eventEmitter.emit.apply(this.eventEmitter, [event, ...args]);
  }

  raise(sender: string, title: string, content?: string, icon?: string) {
    if (this.blocks.includes(sender)) return;
    const notification: INotification = {
      sender,
      title,
      content,
      icon,
      block: () => this.block(sender),
    };
    this.emit('notification', notification);
  }

  block(sender: string) {
    const indexOf = this.blocks.indexOf(sender);
    if (indexOf !== -1) return;
    this.blocks.push(sender);
    this.browserStorage.setItem(this.SERVICE_NAME, this.blocks);
  }

  unblock(sender: string) {
    const indexOf = this.blocks.indexOf(sender);
    if (indexOf === -1) return;
    this.blocks.splice(indexOf, 1);
    this.browserStorage.setItem(this.SERVICE_NAME, this.blocks);
  }
}
