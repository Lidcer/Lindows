import io from "socket.io-client";
import { EventEmitter } from "events";
import { SECOND } from "../../../shared/constants";
import { BaseService, SystemServiceStatus } from "../internals/BaseSystemService";
import { randomString } from "../../../shared/utils";
import { IWebsocketPromise } from "../../../shared/Websocket";
import { Internal } from "../internals/Internal";

const internal = new WeakMap<Network, Internal>();
export class Network extends BaseService {
  private _socket: SocketIOClient.Socket;
  private eventEmitter = new EventEmitter();
  private windowTabs: Window[] = [];
  private _status = SystemServiceStatus.Uninitialized;

  constructor(private _internal: Internal) {
    super();
    internal.set(this, _internal);
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;
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

        this._socket = io(origin);
        this._socket.on("connect", () => {
          this.connection();
          this._status = SystemServiceStatus.Ready;
          resolve();
        });

        setTimeout(() => {
          if (!this._socket.connected) {
            this._status = SystemServiceStatus.Failed;
            reject(new Error("Unable to establish connection"));
          }
        }, SECOND * 10);

        this._socket.on("redirect", (redirectLink: string) => window.location.replace(replaceLink(redirectLink)));
        this._socket.on("open-new-tab", (redirectLink: string) => {
          this.windowTabs.push(window.open(replaceLink(redirectLink), "_blank"));
        });

        this._socket.on("admin-event-log-report", (redirectLink: string) => {
          console.error("this should not be visible");
        });

        this._socket.on("authenticate-failed", (message: string) => {
          console.error(message);
        });

        this._socket.on("disconnect", () => {
          this.emit("connection");
        });

        this._socket.on("take-fingerprint", (message: string) => {
          if (localStorage.getItem("terms-of-policy") !== "true") return;
          const int = internal.get(this);
          this._socket.emit("fingerprint-result", int.hardwareInfo.allResults);
        });
        this._socket.on("close-new-tab", (link: string) => {
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
    this.socket.emit("authenticate", token);
  };

  unauthenticate = () => {
    if (STATIC) return;
    this.socket.emit("unauthenticate");
  };

  connection = () => {
    this.emit("connection");
  };

  emitPromise<K, T extends any[]>(value: string, ...args: T) {
    return new Promise<K>(async (resolve, reject) => {
      if (STATIC) return reject("Not available");
      const id = randomString(16);
      // eslint-disable-next-line prefer-const
      let timeout: NodeJS.Timeout;

      const response = (promise: IWebsocketPromise<K>) => {
        this.socket.removeEventListener(id, response);
        if (timeout !== undefined) {
          clearTimeout(timeout);
        }
        if (promise.reject) {
          const error = new Error(promise.reject.message);
          return reject(error);
        }
        resolve(promise.resolve);
      };
      timeout = setTimeout(() => {
        response({
          id,
          reject: {
            message: "Connection timed out",
          },
          status: "rejected",
        });
      }, 5000);

      this.socket.on(`${value}-${id}`, response);
      const socketPromise: IWebsocketPromise<K> = {
        id,
        status: "pending",
      };
      const socketArgs = [value, socketPromise, ...args];

      this.socket.emit.apply(this.socket, socketArgs);
    });
  }

  get socket() {
    return this._socket;
  }
}
