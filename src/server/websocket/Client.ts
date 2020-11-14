import { isPromiseWebsocket, IWebsocketPromise, objectSocketPromise, TimeoutPromise } from "../../shared/Promise";
import { UserModifiable } from "../routes/users/users-database";
import { SECOND } from "../../shared/constants";
import { logger } from "../database/EventLog";

export class Client {
  _userModifiable: UserModifiable | undefined;
  _active: boolean;
  type: string;

  constructor(private client: SocketIO.Socket) {}

  on(event: string, listener: (...args: any[]) => void) {
    this.client.on(event, listener);
  }
  emit(event: string, ...args: any[]) {
    return this.client.emit.apply(this.client, [event, ...args]);
  }
  emitPromise<R = any>(event: string, ...args: any[]) {
    return new Promise<R>((resolve, reject) => {
      const promise = objectSocketPromise(event);

      let timeout: NodeJS.Timeout;
      const removeTimeout = () => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
      };

      const onPromise = (receivedPromise: IWebsocketPromise<any>) => {
        if (!isPromiseWebsocket(receivedPromise)) return;
        if (receivedPromise.id === promise.id) {
          if (receivedPromise.status === "fulfilled") {
            resolve(receivedPromise.resolve);
          } else if (receivedPromise.status === "rejected") {
            reject(new Error(receivedPromise.reject.message || "Unknown error"));
          } else {
            logger.error("Unexpected promise result", receivedPromise);
            reject(new Error("Unexpected promise result"));
          }
        }
        removeTimeout();
        this.client.removeListener("promise", onPromise);
      };

      this.client.on("promise", onPromise);
      timeout = setTimeout(() => {
        removeTimeout();
        this.client.removeListener("promise", onPromise);
        reject(new Error("Promise timedout"));
      }, SECOND * 10);

      return this.client.emit.apply(this.client, ["promise", promise, args]);
    });
  }
  disconnect() {
    return this.client.disconnect();
  }
  get id() {
    return this.client.id;
  }
  get connected() {
    return this.client.connected;
  }
  get disconnected() {
    return this.client.disconnected;
  }
  get active() {
    if (this.disconnected) return false;
    return this._active;
  }
  set active(value: boolean) {
    this._active = value;
  }
  get userModifiable() {
    if (this.disconnected) return undefined;
    return this._userModifiable;
  }
  set userModifiable(value: UserModifiable) {
    this._userModifiable = value;
  }
  removeUserModifiable() {
    this._userModifiable = undefined;
  }
  get remoteAddress() {
    return this.client.conn.remoteAddress;
  }
}
