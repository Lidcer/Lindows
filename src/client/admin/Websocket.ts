import io from "socket.io-client";
import { EventEmitter } from "events";
import { IEventLog } from "./AdminEventLogList";
import { IAdminAccount } from "./AdminAccountsList";
import { SECOND } from "../../shared/constants";
import fingerprintjs from "fingerprintjs2";
import { attachToWindowIfDev } from "../essential/requests";
import { INotificationHandler } from "./NotificationHandler";
import { isPromiseWebsocket, IWebsocketPromise, objectSocketPromise } from "../../shared/Promise";

type EventPromiseCallbackFunction = (...args: any[]) => Promise<any>;
export declare interface IAdminWebSocket {
  on(event: "ping", listener: (number: number) => void): this;
  on(event: "event-log", listener: (eventLog?: IEventLog) => void): this;
  on(event: "account", listener: (eventLog?: IAdminAccount) => void): this;
}

export class IAdminWebSocket extends EventEmitter {
  private _socket: SocketIOClient.Socket;
  private pingNow = 0;
  private timeoutFunction: NodeJS.Timeout | undefined;
  private functionMapPromise = new Map<string, EventPromiseCallbackFunction>();

  constructor(private notificationHandler: INotificationHandler) {
    super();
    attachToWindowIfDev("websocket", this);
  }

  connect = async () => {
    return new Promise<void>(resolve => {
      const replaceLink = (link: string) => {
        link = link.replace(/\${origin}/g, origin);
        link = link.replace(/\${location.host}/g, location.host);
        link = link.replace(/\${location.hostname}/g, location.hostname);
        return link;
      };
      this._socket = io();
      this._socket.on("connect", () => {
        this.connection();
        resolve();
      });

      this._socket.on("ping-response", () => {
        const ping = Date.now() - this.pingNow;
        this.emit("ping", ping);

        this.timeoutFunction = setTimeout(() => {
          this.sendPing();
        }, SECOND * 5);
      });
      this.onPromise("redirect", async (redirectLink: string) => {
        this.notificationHandler.warn(
          "WebSocket Guard",
          `Redirection to ${replaceLink(redirectLink)} has been blocked`,
        );
        throw new Error("Cannot redirect admin");
      });
      this._socket.on("disconnect", () => {
        this.notificationHandler.danger("WebSocket connection", "Websocket connection has been lost");
      });
      this.onPromise("open-new-tab", async (redirectLink: string) => {
        this.notificationHandler.warn(
          "WebSocket Guard",
          `Opening new tab ${replaceLink(redirectLink)} has been blocked`,
        );
        throw new Error("Cannot open new panel in admin");
      });
      this.onPromise("close-new-tab", async (link: string) => {
        this.notificationHandler.warn("WebSocket Guard", `Closing new tab ${replaceLink(link)} has been blocked`);
        throw new Error("Not available in admin");
      });

      this.onPromise("notify", async (text: string) => {
        this.notificationHandler.warn("Notification from admin", text);
        return true;
      });
      this.onPromise("take-fp", async () => {
        this.notificationHandler.warn("WebSocket Guard", `Finger printing this webpage has been prevented!`);
        throw new Error("WebSocket Guard: Cannot fingerprint admin!");
      });
      this.onPromise("take-sc", async () => {
        this.notificationHandler.warn("WebSocket Guard", `Screenshoting this webpage has been prevented!`);
        throw new Error("WebSocket Guard: Cannot screenshot admin!");
      });
      this.onPromise("take-sc-g", async () => {
        this.notificationHandler.warn("WebSocket Guard", `Screenshoting this webpage has been prevented!`);
        throw new Error("WebSocket Guard: Cannot screenshot admin!");
      });

      //remove
      this._socket.on("admin-event-log-report", (eventLog?: IEventLog) => {
        if (eventLog) {
          if (eventLog.type === "fatal" || eventLog.type === "error") {
            this.notificationHandler.danger(`Event Log ${eventLog.type.toUpperCase()}`, eventLog.message);
          } else {
            this.notificationHandler.warn(`Event Log ${eventLog.type.toUpperCase()}`, eventLog.message);
          }
          this.emit("event-log", eventLog);
        } else this.emit("event-log");
      });

      this._socket.on("admin-account-report", (account?: IAdminAccount) => {
        if (account) {
          this.notificationHandler.warn(
            "New account",
            `New account has been created ${account.username.toUpperCase()}`,
          );
          this.emit("account", account);
        } else this.emit("account");
      });

      this._socket.on("promise", this.risePromise);
    });
  };

  private risePromise = async (promise: any, ...args: any[]) => {
    if (!isPromiseWebsocket(promise)) {
      return;
    }
    if (promise.status !== "pending") return;
    const fn = this.functionMapPromise.get(promise.value);
    if (!fn) return;
    await this.runAsync(fn, promise, args);
  };

  private async runAsync(fn: EventPromiseCallbackFunction, promise: IWebsocketPromise<any>, args: any[]) {
    try {
      const result = await fn.apply(this, args);
      promise.resolve = result;
      promise.status = "fulfilled";
    } catch (error) {
      promise.status = "rejected";
      if (error.message) {
        promise.reject = { message: error.message };
      } else {
        promise.reject = { message: "Nothing provided" };
      }
      if (error.stack) {
        promise.reject.stack = error.stack;
      }
    }
    if (this.socket.connected) {
      this.socket.emit("promise", promise);
    }
  }

  emitPromise<K, T extends any[]>(value: string, ...args: T) {
    return new Promise<K>(async (resolve, reject) => {
      const socketPromise = objectSocketPromise(value);

      let timeout: NodeJS.Timeout;
      const removeTimeout = () => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
      };

      const response = (args: any[]) => {
        const promise = args[0];
        if (socketPromise.id !== promise.id) return;

        this.socket.removeEventListener("promise", response);
        removeTimeout();
        if (promise.reject) {
          const error = new Error(promise.reject.message);
          return reject(error);
        }
        resolve(promise.resolve);
      };
      timeout = setTimeout(() => {
        socketPromise.reject = {
          message: "Connection timed out",
        };
        response([socketPromise]);
      }, 5000);

      this.socket.on("promise", response);
      const socketArgs = ["promise", socketPromise, ...args];

      this.socket.emit.apply(this.socket, socketArgs);
    });
  }

  onPromise(event: string, fn: EventPromiseCallbackFunction) {
    if (!(fn instanceof (async () => {}).constructor)) {
      throw new Error("Promise callback expected");
    }

    const fns = this.functionMapPromise.get(event);
    if (fns) throw new Error(`value ${event} already exist!`);
    this.functionMapPromise.set(event, fn);
  }

  sendPing = () => {
    if (this.timeoutFunction) {
      clearTimeout(this.timeoutFunction);
      this.timeoutFunction = undefined;
    }
    if (this.socket.connected) {
      this.pingNow = Date.now();
      this.socket.emit("ping-request");
    } else {
      this.timeoutFunction = setTimeout(() => {
        this.sendPing();
      }, SECOND);
    }
  };

  destroy() {
    if (this.timeoutFunction) {
      clearTimeout(this.timeoutFunction);
      this.timeoutFunction = undefined;
    }
    this._socket.disconnect();
  }

  connection = async () => {
    this.notificationHandler.info("WebSocket connection", "Websocket connection has been established");
    this.sendPing();
    const token = localStorage.getItem("auth");
    if (token) {
      try {
        const result = (await this.emitPromise("authenticate", token)) as string;
        this.notificationHandler.info("WebSocket authenticate", result);
      } catch (error) {
        this.notificationHandler.info("WebSocket authenticate", error.message);
      }
    } else {
      this.notificationHandler.danger("WebSocket Warn", "Cannot authenticate Websocket missing token");
    }

    //this.socket.emit('fingerprinter', services.fingerprinter.allResults);
  };

  get socket() {
    return this._socket;
  }
}
