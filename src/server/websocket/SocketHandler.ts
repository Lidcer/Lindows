import { attachDebugMethod } from "../devDebugger";
import { logger } from "../database/EventLog";
import { pushUniqToArray, removeFromArray } from "../../shared/utils";
import { SocketValidator } from "./WebsocketSecurity";
import { isPromiseWebsocket } from "../../shared/Promise";
import { Server } from "http";
import { listen } from "socket.io";
import { IS_DEV } from "../config";
import { Client } from "./Client";

type WebsocketCallback = (client: Client, ...args: any[] | any) => void;
type WebsocketCallbackPromise = (client: Client, ...args: any[] | any) => Promise<any>;

export class WebSocket {
  private socketServer: SocketIO.Server;
  private clients: Client[] = [];
  private callbacks = new Map<string, WebsocketCallback[]>();
  private promiseCallback = new Map<string, WebsocketCallbackPromise>();
  readonly socketValidator = new SocketValidator(this);

  constructor(server: Server) {
    this.socketServer = listen(server);
    attachDebugMethod("webSocket", this);
    logger._setWebSocket(this);
    this.socketServer.on("connection", c => {
      const client = new Client(c);
      logger.debug("[WebSocket]", "connected", client.id);
      this.clients.push(client);

      for (const [value, fns] of this.callbacks) {
        client.on(value, (...args) => {
          for (const fn of fns) {
            fn.apply(fn, [client, ...args]);
          }
        });
      }

      client.on("disconnect", () => {
        removeFromArray(this.clients, client);
        logger.debug("[WebSocket]", "disconnected", client.id);
      });

      client.on("promise", async (promise, ...args) => {
        this.socketValidator.validateObject(client, promise);

        if (!isPromiseWebsocket(promise)) return;
        if (promise.status !== "pending") return;

        const promiseCallback = this.promiseCallback.get(promise.value);
        if (!promiseCallback) {
          promise.reject = {
            message: "unknown value!",
          };
          promise.status = "rejected";

          client.emit("promise", promise);
          return;
        }
        try {
          const r = [client, ...args];

          const result = await promiseCallback.apply(this, r);
          if (client.connected) {
            promise.status = "fulfilled";
            promise.resolve = result;
            client.emit("promise", promise);
          }
          return;
        } catch (error) {
          if (IS_DEV) {
            console.error(error);
          }
          if (client.connected) {
            promise.status = "rejected";
            promise.reject = {
              message: error.message || "Unknown error",
            };
            if (IS_DEV && error.stack) {
              promise.reject.stack = error.stack;
            }
            client.emit("promise", promise);
          }
        }
      });
    });
  }

  getAllClients() {
    return [...this.clients];
  }

  broadcast(message: string, arg1?: any, arg2?: any, arg3?: any) {
    if (!message.length) {
      throw new Error("Cannot broadcast empty message");
    }
    for (const client of this.clients) {
      client.emit(message, arg1, arg2, arg3);
    }
  }

  on<T extends any[]>(value: string, callback: (client: Client, ...args: T) => void) {
    const callbackFunction = this.callbacks.get(value) || [];
    pushUniqToArray(callbackFunction, callback);
    this.callbacks.set(value, callbackFunction);
  }

  onPromise<A, T extends any[]>(value: string, callback: (client: Client, ...args: T) => Promise<A>) {
    if (!(callback instanceof (async () => {}).constructor)) {
      throw new Error("Promise callback expected");
    }

    const promiseFn = this.promiseCallback.get(value);
    if (promiseFn) throw new Error(`Used value: "${value}" Already exist!`);
    this.promiseCallback.set(value, callback);
  }

  // removeListener(value: string, callback: (client: SocketIO.Socket, ...args: any[]) => void) {
  //   const promiseCallback = this.callbacks.get(value);
  //   if (promiseCallback) {
  //     removeFromArray(promiseCallback, callback);
  //   }
  // }
  removePromiseListener(value: string, callback: (client: Client, ...args: any[]) => void) {
    const promiseCallback = this.promiseCallback.get(value);
    if (promiseCallback === callback) {
      this.promiseCallback.delete(value);
    }
  }

  getClientByRoles(role: string) {
    const clients: Client[] = [];
    const clientsToScan = this.clients.filter(c => c.userModifiable);
    for (const client of clientsToScan) {
      if (client.userModifiable && client.userModifiable.roles.includes(role)) clients.push(client);
    }
    return clients;
  }

  getClients() {
    return this.clients;
  }

  // guessSameClients() {
  //   const clientWithData = this.IClients.filter(c => c.fingerPrintData);
  //   const guessedClients: { iClient: IClient; data: string }[] = [];
  //   for (const iClient of clientWithData) {
  //     const data = JSON.stringify(iClient.fingerPrintData) + iClient.client.conn.remoteAddress;
  //     guessedClients.push({ iClient, data });
  //   }
  //   const filteredArray: { iClient: IClient[]; data: string }[] = [];
  //   for (const gc of guessedClients) {
  //     const found = filteredArray.find(c => c.data === gc.data);
  //     if (!found) {
  //       filteredArray.push({ iClient: [gc.iClient], data: gc.data });
  //     } else {
  //       found.iClient.push(gc.iClient);
  //     }
  //   }
  //   for (const index in filteredArray) {
  //     filteredArray[index].data = undefined;
  //     delete filteredArray[index].data;
  //   }

  //   return filteredArray;
  // }
}
