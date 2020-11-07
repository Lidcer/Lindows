import { attachDebugMethod } from "../devDebugger";
import { logger } from "../database/EventLog";
import { getUserById, MongooseUserSchema, UserModifiable } from "../routes/users/users-database";
import { getTokenData } from "../routes/common";
import { pushUniqToArray, removeFromArray } from "../../shared/utils";
import { SocketValidator } from "./WebsocketSecurity";
import { IWebsocketPromise } from "../../shared/Websocket";

type WebsocketCallback = (client: SocketIO.Socket, ...args: any[] | any) => void;
type WebsocketCallbackPromise = (client: SocketIO.Socket, ...args: any[] | any) => Promise<any>;

interface SocketPromise<A = undefined> {
  resolve: (a: A) => void;
  reject: (error: Error) => void;
  status: IWebsocketPromise["status"];
}

export class WebSocket {
  private clients: SocketIO.Socket[] = [];
  private active = new Map<SocketIO.Socket, boolean>();
  private callbacks = new Map<string, WebsocketCallback[]>();
  private promiseCallback = new Map<string, WebsocketCallbackPromise[]>();
  private userModifiables = new Map<SocketIO.Socket, UserModifiable>();
  readonly socketValidator = new SocketValidator(this);

  constructor(socketServer: SocketIO.Server) {
    attachDebugMethod("webSocket", this);
    logger._setWebSocket(this);
    socketServer.on("connection", client => {
      logger.debug("[WebSocket]", "connected", client.id);
      this.clients.push(client);

      const values: string[] = [];

      for (const [value] of this.callbacks) {
        values.push(value);
      }
      for (const [value] of this.promiseCallback) {
        values.push(value);
      }
      for (const value of values) {
        this.updateEventListenersOnAllClients(value);
      }

      client.on("disconnect", () => {
        this.active.delete(client);
        client.removeAllListeners();
        removeFromArray(this.clients, client);
        logger.debug("[WebSocket]", "disconnected", client.id);
      });

      client.on("focused", active => {
        if (!this.socketValidator.validateBoolean(client, active)) return;
        this.active.set(client, active);
      });

      client.on("ping-request", arg => {
        if (!this.socketValidator.validateUndefined(client, arg)) return;
        client.emit("ping-response");
      });

      client.on("authenticate", async (token: string) => {
        if (!this.socketValidator.validateString(client, token)) return;
        const decode = await getTokenData(undefined, token);
        if (!decode) {
          return client.emit("authenticate-failed", "Invalid token");
        }
        try {
          let user: UserModifiable;
          for (const [_, schema] of this.userModifiables) {
            if (schema.id.toString() === decode.id) {
              user = schema;
              break;
            }
          }
          if (!user) {
            user = await getUserById(decode.id);
          }

          if (!user) throw new Error("User does not exist");
          this.userModifiables.set(client, user);
          return client.emit("authenticate-success", `Authentication succeeded Welcome ${user.displayedName}`);
        } catch (error) {
          return client.emit("authenticate-failed", "Invalid token");
        }
      });

      client.on("unauthenticate", async (und: undefined) => {
        if (!this.socketValidator.validateUndefined(client, und)) return;
        this.userModifiables.delete(client);
      });
    });
  }

  isPromise(promise: IWebsocketPromise): promise is IWebsocketPromise {
    if (typeof promise !== "object") return false;
    if (!promise.id) return false;
    if (!promise.status) return false;
    return true;
  }

  isClientActive(client: SocketIO.Socket) {
    return !!this.active.get(client);
  }

  broadcast(message: string, arg1?: any, arg2?: any, arg3?: any) {
    if (!message.length) {
      throw new Error("Cannot broadcast empty message");
    }
    for (const client of this.clients) {
      client.emit(message, arg1, arg2, arg3);
    }
  }

  on<T extends any[]>(value: string, callback: (client: SocketIO.Socket, ...args: T) => void) {
    const callbacks = this.callbacks.get(value) || [];
    const indexOf = callbacks.indexOf(callback);
    if (indexOf === -1) callbacks.push(callback);
    this.updateEventListenersOnAllClients(value);
    this.callbacks.set(value, callbacks);
  }

  onPromise<A, T extends any[]>(value: string, callback: (client: SocketIO.Socket, ...args: T) => Promise<A>) {
    if (!(callback instanceof (async () => {}).constructor)) {
      throw new Error("Promise callback expected");
    }

    const callbacks = this.promiseCallback.get(value) || [];
    pushUniqToArray(callbacks, callback);
    this.updateEventListenersOnAllClients(value);
    this.promiseCallback.set(value, callbacks);
  }

  removeListiner(value: string, callback: (client: SocketIO.Socket, ...args: any[]) => void) {
    const callbacks = this.callbacks.get(value) || [];
    const indexOf = callbacks.indexOf(callback);
    if (indexOf !== -1) callbacks.splice(indexOf, 1);
    this.updateEventListenersOnAllClients(value);
    this.callbacks.delete(value);
  }

  private updateEventListenersOnAllClients<T extends any[]>(value: string) {
    const callbacks = this.callbacks.get(value) || [];
    const promiseCallbacks = this.promiseCallback.get(value) || [];

    for (const client of this.clients) {
      client.removeAllListeners(value);
      client.on(value, async (...args: T) => {
        let promise: IWebsocketPromise | undefined = undefined;
        if (args.length && this.isPromise(args[0])) {
          promise = args.shift();
        }
        if (!!promise) {
          for (const cb of promiseCallbacks) {
            try {
              const result = await cb.apply(this, [client, ...args]);
              const responsePromise: IWebsocketPromise = {
                id: promise.id,
                resolve: result,
                status: "fulfilled",
              };
              if (!client.disconnected) {
                client.emit(`${value}-${promise.id}`, responsePromise);
              }
            } catch (error) {
              const responsePromise: IWebsocketPromise = {
                id: promise.id,
                reject: {
                  message: "Unknown error",
                },
                status: "rejected",
              };

              if (error && error.message) {
                responsePromise.reject.message = error.message;
              }
              if (!client.disconnected) {
                client.emit(`${value}-${promise.id}`, responsePromise);
              }
            }
          }
        } else {
          for (const cb of callbacks) {
            cb.apply(this, [client, ...args]);
          }
        }
      });
    }
  }

  getClientUserSchema(client: SocketIO.Socket): UserModifiable {
    return this.userModifiables.get(client);
  }

  getUserSchemaClients(userSchema: MongooseUserSchema): SocketIO.Socket[] {
    const clients: SocketIO.Socket[] = [];
    for (const [client, us] of this.userModifiables) {
      if (us && userSchema.id.toString() === us.id.toString()) clients.push(client);
    }
    return clients;
  }

  getClientByRoles(role: string) {
    const clients: SocketIO.Socket[] = [];
    for (const [client, us] of this.userModifiables) {
      if (us && us.roles.includes(role)) clients.push(client);
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
