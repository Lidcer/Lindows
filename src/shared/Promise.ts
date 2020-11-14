import { SECOND } from "./constants";
import { randomString } from "./utils";
import { SocketError } from "./Websocket";

export interface IWebsocketPromise<A = undefined> {
  id: string;
  value: string;
  resolve?: A;
  reject?: SocketError;

  status: "pending" | "rejected" | "fulfilled";
  type: "websocket-promise";
}

export class TimeoutPromise<T = any> extends Promise<T> {
  constructor(executor: (resolve: (value?: T) => void, reject: (reason?: any) => void) => void, ms = SECOND) {
    super((resolve, reject) => {
      executor(resolve, reject);
      if (ms) {
        setTimeout(() => {
          reject(new Error("Timed out"));
        }, ms);
      }
    });
  }
}

export function objectSocketPromise(value: string): IWebsocketPromise {
  return {
    value,
    id: randomString(16),
    status: "pending",
    type: "websocket-promise",
  };
}

export function isPromiseWebsocket<T = any>(promise: IWebsocketPromise<T>): promise is IWebsocketPromise<T> {
  if (typeof promise !== "object") return false;
  if (Array.isArray(promise)) return false;
  if (!promise.id) return false;
  if (!promise.status) return false;
  return true;
}
