import { EventEmitter } from 'events';

export declare interface INotificationHandler {
  on(event: 'info', listener: (title: string, message: string) => void): this;
  on(event: 'danger', listener: (title: string, message: string) => void): this;
  on(event: 'warn', listener: (title: string, message: string) => void): this;
}

export class INotificationHandler extends EventEmitter {
  danger(title: string, message: string) {
    this.emit('danger', title, message);
  }
  warn(title: string, message: string) {
    this.emit('warn', title, message);
  }
  info(title: string, message: string) {
    this.emit('info', title, message);
  }
}

export const notificationHandler = new INotificationHandler();
