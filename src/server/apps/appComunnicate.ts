import { pushUniqToArray, randomString, removeFromArray } from "../../shared/utils";
import { AppOptions } from "../../shared/Websocket";
import { IS_DEV } from "../config";
import { WebSocket } from "../websocket/SocketHandler";

interface ClientApp extends AppOptions {
  appId: string;
  host: SocketIO.Socket;
  listeners: SocketIO.Socket[];
}

const appIDs = new Map<string, ClientApp>();
const appClient = new Map<SocketIO.Socket, ClientApp>();

export function setupAppWebsocket(websocket: WebSocket) {
  const appDestroy = (host?: SocketIO.Socket, appId?: string) => {
    let clientApp: ClientApp;
    if (host) {
      clientApp = appClient.get(host);
    } else if (appId) {
      clientApp = appIDs.get(appId);
    }
    if (!clientApp) {
      IS_DEV && console.error("Unable to destory app");
      return;
    }
    for (const listener of clientApp.listeners) {
      listener.emit("app-destroyed", appIDs);
    }
    appIDs.delete(clientApp.appId);
    appClient.delete(clientApp.host);
  };

  websocket.onPromise("app-host", async (client, appOptions: AppOptions) => {
    if (typeof appOptions.appName !== "string") throw new Error("Unknown app");
    if (typeof appOptions.maxConnections !== "number") throw new Error("Please specify max connections");
    if (appOptions.maxConnections < 1) throw new Error("Max connection cannot be less than 1");
    const app = appClient.get(client);
    if (app) throw new Error(`You are already hosting app. ${app.appName}. Close connection and try again.`);

    let randomId = "";
    do {
      randomId = randomString(5);
    } while (appIDs.has(randomId));

    const clientApp: ClientApp = {
      host: client,
      appId: randomId,
      appName: appOptions.appName,
      maxConnections: appOptions.maxConnections,
      listeners: [],
    };
    appIDs.set(randomId, clientApp);
    appClient.set(client, clientApp);
    return randomId;
  });

  websocket.onPromise("app-host-disconnect-client", async (client, clientId: string) => {
    if (typeof clientId !== "string") throw new Error("provide client id");
    const app = appClient.get(client);
    if (!app) throw new Error(`You aren't hosting any app`);
    const c = app.listeners.find(c => c.id === clientId);
    if (!c) throw new Error("client under this id is not connected!");
    removeFromArray(app.listeners, c);
    console.log("emitting", app.appId, c);
    c.emit("app-destroyed", app.appId);
    app.host.emit("app-client-disconnected", c.id);
  });

  websocket.on("disconnect", client => {
    appDestroy(client);
  });
  websocket.on("app-destroy", client => {
    appDestroy(client);
  });

  websocket.onPromise("app-connect", async (client, appName: ClientApp["appName"], appId: ClientApp["appId"]) => {
    if (typeof appName !== "string") throw new Error("App name not provided");
    if (typeof appId !== "string") throw new Error("App id not provided");
    const clientApp = appIDs.get(appId);
    if (!clientApp) throw new Error("Not found");
    if (clientApp.appName !== appName) throw new Error("Wrong app provided");
    if (clientApp.listeners.length > clientApp.maxConnections) throw new Error("Connection is full");

    const result = pushUniqToArray(clientApp.listeners, client);
    if (result) {
      const disconnected = (appId: string) => {
        if (appId || appId !== clientApp.appId) {
          return;
        }
        const success = removeFromArray(clientApp.listeners, client);
        if (success) {
          clientApp.host.emit("app-client-disconnected", client.id);
        }
      };
      client.on("disconnect", disconnected);
      client.on("app-disconnet", disconnected);
    }
    clientApp.host.emit("app-client-connected", client.id);
  });

  websocket.onPromise("app-host-broadcast", async (client, ...args) => {
    const clientApp = appClient.get(client);
    if (!clientApp) throw new Error("You need to host app before you can broadcast");
    const toBroadcast = ["app-host-on", clientApp.appName, clientApp.appId, ...args];
    for (const iterator of clientApp.listeners) {
      iterator.emit.apply(iterator, toBroadcast);
    }
  });
  websocket.onPromise("app-host-emit", async (client, websocketID, ...args) => {
    const clientApp = appClient.get(client);
    if (!clientApp) throw new Error("You need to host app before you can broadcast");
    const e = clientApp.listeners.find(s => s.id === websocketID);
    if (!e) throw new Error("Receiver not found!");
    const toBroadcast = ["app-host-on", clientApp.appName, clientApp.appId, ...args];
    e.emit.apply(e, toBroadcast);
  });

  websocket.onPromise("app-client-emit", async (client, appId, ...args) => {
    if (typeof appId !== "string") throw new Error("Please provide app id");
    const clientApp = appIDs.get(appId);
    if (!clientApp) throw new Error("App does not exist!");
    const exist = clientApp.listeners.indexOf(client) !== -1;
    if (!exist) throw new Error("You do not have access to this connection");
    clientApp.host.emit.apply(clientApp.host, ["app-client-on", client.id, ...args]);
  });
}

(global as any).appIDs = appIDs;
(global as any).appClient = appClient;
