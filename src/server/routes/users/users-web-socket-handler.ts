import { logger } from "../../database/EventLog";
import { WebSocket } from "../../websocket/SocketHandler";
import { getTokenData } from "../common";
import { getUserById, UserModifiable } from "./users-database";

interface PingResponse {
  clientDate: string;
  serverDate: string;
}

export function setupUserWebsocket(websocket: WebSocket) {
  websocket.onPromise<string, [string]>("authenticate", async (client, token) => {
    if (!websocket.socketValidator.validateString(client, token)) {
      throw new Error("token was not provided!");
    }
    const decode = await getTokenData(undefined, token);
    if (!decode) {
      throw new Error("Invalid token");
    }
    try {
      let user: UserModifiable;
      const userModifiables = websocket.getAllClients().filter(c => c.userModifiable);
      for (const client of userModifiables) {
        if (client.userModifiable.id === decode.id) {
          user = client.userModifiable;
          break;
        }
      }
      if (!user) {
        user = await getUserById(decode.id);
      }
      if (!user) throw new Error("User does not exist");
      client.userModifiable = user;
      return `Authentication succeeded Welcome ${user.displayedName}`;
    } catch (error) {
      logger.error("authenticate socket", error);
      throw new Error("Invalid token");
    }
  });

  websocket.onPromise<string, []>("unauthenticate", async client => {
    client.removeUserModifiable();
    return "Unauthenticateed";
  });
  websocket.onPromise<PingResponse, [string]>("ping-request", async (client, date) => {
    if (!websocket.socketValidator.validateString(client, date)) {
      throw new Error("date was not provided!");
    }
    const clientDate = date;
    const serverDate = new Date().toString();
    const response: PingResponse = {
      clientDate,
      serverDate,
    };
    client.removeUserModifiable();
    return response;
  });

  websocket.on<[boolean]>("active", (client, active) => {
    if (!websocket.socketValidator.validateBoolean(client, active)) {
      throw new Error("boolean was not provided!");
    }
    client.active = active;
  });
}
