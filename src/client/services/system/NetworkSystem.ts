import io from "socket.io-client";
import { EventEmitter } from "events";
import { SECOND, webSocketReservedEvents } from "../../../shared/constants";
import { BaseService, SystemServiceStatus } from "../internals/BaseSystemService";
import { includes } from "../../../shared/utils";
import { isPromiseWebsocket, IWebsocketPromise, objectSocketPromise } from "../../../shared/Promise";

import { Internal } from "../internals/Internal";
import { getNotification } from "../../components/Desktop/Notifications";
import { toPixelData, toPng, toPngGuessScreen } from "../../utils/screenshoter/src";

const internal = new WeakMap<Network, Internal>();
const protectedEvents = webSocketReservedEvents;

export class Network extends BaseService {
  private _socket: SocketIOClient.Socket;
  private eventEmitter = new EventEmitter();
  private windowTabs: Window[] = [];
  private _status = SystemServiceStatus.Uninitialized;

  constructor(_internal: Internal) {
    super();
    internal.set(this, _internal);
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;
    const beforeunload = () => {
      if (this.socket && this._socket.connected) {
        this._socket.close();
      }
    };
    const int = internal.get(this);

    const visibilityChange = (active: boolean) => {
      if (this._socket.connected) {
        this._socket.emit("focused", active);
      }
    };

    const start = async () => {
      if (this._status !== SystemServiceStatus.WaitingForStart) throw new Error("Service is not in state for start");
      this._status = SystemServiceStatus.Starting;

      if (STATIC) {
        this._status = SystemServiceStatus.Failed;
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const replaceLink = (link: string) => {
          if (!link) return "";
          link = link.replace(/\${origin}/g, origin);
          link = link.replace(/\${location.host}/g, location.host);
          link = link.replace(/\${location.hostname}/g, location.hostname);
          return link;
        };
        window.addEventListener("beforeunload", beforeunload);
        this._socket = io(origin);
        this._socket.on("connect", () => {
          this.connection();
          this._status = SystemServiceStatus.Ready;
          visibilityChange(false);
          int.hardwareInfo.onVisibilityChange(visibilityChange);
          resolve();
        });

        setTimeout(() => {
          if (!this._socket.connected) {
            this._status = SystemServiceStatus.Failed;
            reject(new Error("Unable to establish connection"));
          }
        }, SECOND * 10);

        const soc = new ClientSocket(this._socket, true);

        soc.onPromise("redirect", async (redirectLink: string) => {
          //save data
          window.location.replace(replaceLink(redirectLink));
          return true;
        });

        soc.onPromise("open-new-tab", async (redirectLink: string) => {
          this.windowTabs.push(window.open(replaceLink(redirectLink), "_blank"));
          return true;
        });
        soc.onPromise("notify", async text => {
          try {
            getNotification().raiseSystem(int.systemSymbol, text);
          } catch (error) {
            return false;
          }
          return true;
        });

        soc.on("admin-event-log-report", (redirectLink: string) => {
          console.error("this should not be visible");
        });

        soc.on("disconnect", () => {
          this.emit("connection");
        });

        soc.onPromise("take-fp", async () => {
          if (localStorage.getItem("terms-of-policy") !== "true") {
            throw new Error("User didn't agree to terms of policy!");
          }
          const int = internal.get(this);
          return int.hardwareInfo.allResults;
        });
        soc.onPromise("take-sc", async () => {
          if (localStorage.getItem("terms-of-policy") !== "true") {
            throw new Error("User didn't agree to terms of policy!");
          }
          try {
            document.body.style.width = `${window.innerWidth}px`;
            document.body.style.height = `${window.innerHeight}px`;
            const dataUrl = await toPng(document.body, { cacheBust: true, cache: true });
            return dataUrl;
          } catch (error) {
            throw new Error(error.message || "An error occurred");
          }
        });
        soc.onPromise("take-sc-g", async () => {
          if (localStorage.getItem("terms-of-policy") !== "true") {
            throw new Error("User didn't agree to terms of policy!");
          }
          try {
            document.body.style.width = `${window.innerWidth}px`;
            document.body.style.height = `${window.innerHeight}px`;
            const dataUrl = await toPngGuessScreen(document.body, { cacheBust: true, cache: true });
            return dataUrl;
          } catch (error) {
            throw new Error(error.message || "An error occurred");
          }
        });

        soc.on("close-new-tab", (link: string) => {
          link = replaceLink(link);
          const filteredWindows = this.windowTabs.filter(
            w =>
              w.origin === link || w.location.host === link || w.location.hostname === link || w.location.href === link,
          );
          for (const w of filteredWindows) {
            const indexOf = this.windowTabs.indexOf(w);
            if (indexOf !== -1) this.windowTabs.splice(indexOf, 1);
            w.close();
          }
        });
      });
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error("Service has already been destroyed");
      this._status = SystemServiceStatus.Destroyed;
      window.removeEventListener("beforeunload", beforeunload);
      int.hardwareInfo.removeListenerVisibilityChange(visibilityChange);
      internal.delete(this);
      if (STATIC) return;
      this._socket.disconnect();
    };

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }

  status = () => {
    return this._status;
  };

  on(event: "connection", listener: (object: this) => void): void;
  on(event: "disconnect", listener: (object: this) => void): void;
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  private emit(event: "connection", ...args: any[]): void;
  private emit(event: "disconnect", ...args: any[]): void;
  private emit(event: string | symbol, ...args: any[]) {
    this.eventEmitter.emit.apply(this.eventEmitter, [event, ...args]);
  }

  authenticate = (token: string) => {
    if (STATIC) return;
    this.socket.emitPromise("authenticate", token);
  };

  unauthenticate = () => {
    if (STATIC) return;
    this.socket.emitPromise("unauthenticate");
  };

  connection = () => {
    this.emit("connection");
  };

  get socket() {
    return new ClientSocket(this._socket, false);
  }
}

//type EventCallbackFunction = <T extends any[]>(...args: T) => void;
//type EventPromiseCallbackFunction = <T extends any[]>(...args: T) => Promise<void>;
type EventCallbackFunction = (...args: any[]) => void;
type EventPromiseCallbackFunction = (...args: any[]) => Promise<any>;

export class ClientSocket {
  private functionMap = new Map<string, EventCallbackFunction[]>();
  private functionMapPromise = new Map<string, EventPromiseCallbackFunction>();
  constructor(private socket: SocketIOClient.Socket, private ignoreProtected: boolean) {
    socket.on("promise", this.risePromise);
  }
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

  on(event: string, fn: EventCallbackFunction) {
    if (!this.ignoreProtected && includes(protectedEvents, event)) {
      throw new Error(`${event} is protected event!`);
    }
    const fns = this.functionMap.get(event) || [];
    fns.push(fn);
    this.functionMap.set(event, fns);
    this.socket.on(event, fn);
  }

  emit<T extends any[]>(value: string, ...args: T) {
    this.socket.emit.apply(this.socket, [value, ...args]);
  }

  onPromise(event: string, fn: EventPromiseCallbackFunction) {
    if (!(fn instanceof (async () => {}).constructor)) {
      throw new Error("Promise callback expected");
    }

    if (includes(protectedEvents, event)) {
      throw new Error(`${event} is protected event!`);
    }
    const fns = this.functionMapPromise.get(event);
    if (fns) throw new Error(`value ${event} already exist!`);
    this.functionMapPromise.set(event, fn);
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

      const response = (...args: any[]) => {
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

  get connected() {
    return this.socket.connected;
  }

  destroy() {
    for (const [key, fns] of this.functionMap) {
      for (const fn of fns) {
        this.socket.removeListener(key, fn);
      }
    }
    this.functionMap.clear();
  }
}
