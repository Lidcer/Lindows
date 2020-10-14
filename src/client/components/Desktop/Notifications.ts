import { EventEmitter } from 'events';
import { BrowserStorage } from '../../services/SystemService/BrowserStorageSystem';
import { internal } from '../../services/SystemService/ServiceHandler';
import { BaseWindow, MessageBox } from '../../apps/BaseWindow/BaseWindow';
import { attachDebugMethod } from '../../essential/requests';
import { Processor } from '../../services/SystemService/ProcessorSystem';

export interface INotification {
    icon?: string;
    title: string;
    content?: string;
    sender: string;
    block: () => void;
}

export class NotificationSystem {
    private SERVICE_NAME = '__notification__';
    private eventEmitter = new EventEmitter();
    private blocks: string[] = [];
    private browserStorage: BrowserStorage;
    private processor: Processor;
    constructor() {
        attachDebugMethod('notif', this);
        this.browserStorage = internal.browserStorage;
        this.processor = internal.processor;
        if (!this.browserStorage.ready) {
            throw new Error('BrowserStorage is not ready');
        }
        if (!this.processor.ready) {
            throw new Error('processor is not ready');
        }


    }

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
  
    raise(sender: BaseWindow, title: string, content?: string, icon?: string) {
      const senderString = sender.getManifest().fullAppName;
      const found = this.processor.runningApps.find(d => d.object === sender);
      if (!found) {
        MessageBox._anonymousShow('Notification cannot be displayed. Unknown origin of the app', 'Security Violation');
        throw new Error('Unknown origin of the app');
      }

      if (this.blocks.includes(senderString)) return;
      
      const notification: INotification = {
        sender:senderString,
        title,
        content,
        icon,
        block: () => this.block(senderString),
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

    destroy(){
        this.eventEmitter.removeAllListeners();
    }
}

let notification: NotificationSystem;

export function getNotification(reInit = false) {
    if(!notification) {
        notification = new NotificationSystem();
    } else if (reInit) {
        notification.destroy();
        notification = new NotificationSystem();
    }
    return notification;
}