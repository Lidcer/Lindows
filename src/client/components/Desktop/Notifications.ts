import { EventEmitter } from "events";
import { internal } from "../../services/internals/Internal";
import { BaseWindow, MessageBox } from "../../apps/BaseWindow/BaseWindow";
import { attachToWindowIfDev } from "../../essential/requests";
import { Processor } from "../../services/system/ProcessorSystem";

export interface INotification {
  icon?: string;
  title: string;
  content?: string;
  sender: string;
  block: () => void;
}

const regkey = "__notificationsBlockers";
export class NotificationSystem {
  private eventEmitter = new EventEmitter();
  private blocked: string[] = [];
  private processor: Processor;
  constructor() {
    attachToWindowIfDev("notif", this);
    const blockers = internal.system.registry.getRootItem(regkey, internal.systemSymbol);
    if (blockers && Array.isArray(blockers.data)) {
      this.blocked = blockers.data;
    }
    this.processor = internal.system.processor;
    if (!this.processor.ready) {
      throw new Error("processor is not ready");
    }
  }

  on(event: "destroy", listener: () => void): void;
  on(event: "notification", listener: (notification: INotification) => void): void;
  on(event: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }
  removeListener(event: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.removeListener(event, listener);
  }

  private emit(event: "destroy"): void;
  private emit(event: "notification", notification: INotification): void;
  private emit(event: string | symbol, ...args: any[]) {
    this.eventEmitter.emit.apply(this.eventEmitter, [event, ...args]);
  }

  raise(sender: BaseWindow, title: string, content?: string, icon?: string) {
    const senderString = sender.getManifest().fullAppName;
    const found = this.processor.runningApps.find(d => d.object === sender);
    if (!found) {
      MessageBox._anonymousShow("Notification cannot be displayed. Unknown origin of the app", "Security Violation");
      throw new Error("Unknown origin of the app");
    }

    if (this.blocked.includes(senderString)) return;

    const notification: INotification = {
      sender: senderString,
      title,
      content,
      icon,
      block: () => this.block(senderString),
    };
    this.emit("notification", notification);
  }

  async block(sender: string) {
    const indexOf = this.blocked.indexOf(sender);
    if (indexOf !== -1) return;
    this.blocked.push(sender);
    await internal.system.registry.setRootItem(regkey, this.blocked, internal.systemSymbol);
  }

  async unblock(sender: string) {
    const indexOf = this.blocked.indexOf(sender);
    if (indexOf === -1) return;
    this.blocked.splice(indexOf, 1);
    await internal.system.registry.setRootItem(regkey, this.blocked, internal.systemSymbol);
  }

  destroy() {
    this.eventEmitter.removeAllListeners();
  }
}

let notification: NotificationSystem;

export function getNotification(reInit = false) {
  if (!notification) {
    notification = new NotificationSystem();
  } else if (reInit) {
    notification.destroy();
    notification = new NotificationSystem();
  }
  return notification;
}
