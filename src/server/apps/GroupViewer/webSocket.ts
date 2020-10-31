import { WebSocket } from "../../websocket/SocketHandler";
import { random } from "loadsh";

const map = new Map<SocketIO.Socket, string>();
const clientToClient = new Map<SocketIO.Socket, SocketIO.Socket>();

(global as any).map = map;
(global as any).clientToClient = clientToClient;

export function setupGroupViewerWebsocket(websocket: WebSocket) {
  websocket.onPromise<string, []>("group-viewer-ready", async iClient => {
    const n = () => {
      return random(0, 9);
    };
    let id = "";
    for (let i = 1; i < 12; i++) {
      if (i % 4) {
        id += n();
      } else {
        id += " ";
      }
    }

    map.set(iClient, id);
    return id;
  });
  websocket.onPromise<boolean, [string, string]>("group-viewer-connect", async (iClient, id, password) => {
    websocket.socketValidator.validateString(iClient, id);
    websocket.socketValidator.validateString(iClient, password);
    for (const [client, clientId] of map) {
      if (clientId === id) {
        client.emit("group-viewer-password-check", password, iClient.id);
        return true;
      }
    }
    return false;
  });

  websocket.on("group-viewer-clean", iClient => {
    disconnect(iClient);
  });
  websocket.on("disconnect", iClient => {
    disconnect(iClient);
  });
  websocket.on<[boolean, string, number]>("group-viewer-password-response", (iClient, bool, clientID) => {
    websocket.socketValidator.validateBoolean(iClient, bool);
    websocket.socketValidator.validateString(iClient, clientID);
    for (const [client] of map) {
      if (client.id === clientID) {
        if (bool) {
          clientToClient.set(iClient, client);
          clientToClient.set(client, iClient);
        }
        client.emit("group-viewer-establish", bool);
        iClient.emit("group-viewer-establish", bool);
      }
    }
  });

  websocket.on<[string, any]>("group-viewer-event", (iClient, eventName, object) => {
    websocket.socketValidator.validateString(iClient, eventName);
    websocket.socketValidator.validateObject(iClient, object);
    const client = clientToClient.get(iClient);
    client.emit("group-viewer-event", eventName, object);
  });

  websocket.onPromise<void, [Uint8Array, any]>("group-viewer-screen", async (iClient, uint8Array, _bounds) => {
    const client = clientToClient.get(iClient);
    if (!client) {
      throw new Error("Client disconnected");
    }
    client.emit("group-viewer-display", uint8Array, _bounds);
  });
}

function disconnect(iClient: SocketIO.Socket) {
  map.delete(iClient);
  for (const [c1, c2] of clientToClient) {
    if (c2 === iClient) {
      clientToClient.delete(c1);
      clientToClient.delete(iClient);
      break;
    }
  }
}
