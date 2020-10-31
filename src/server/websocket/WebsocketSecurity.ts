//SocketIO.Socket

import { logger } from "../database/EventLog";
import { WebSocket } from "./SocketHandler";
import { IWebsocketPromise } from "../../shared/Websocket";

export class SocketValidator {
  constructor(private webSocket: WebSocket) {}

  validateWebSocketPromise(client: SocketIO.Socket, promise: IWebsocketPromise) {
    const error = () => {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate websocketPromise client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    };
    if (typeof promise !== "object") return error();
    if (!promise.id) return error();
    if (!promise.status) return error();
    return true;
  }

  validateString(client: SocketIO.Socket, string: string) {
    if (typeof string !== "string") {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate string client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateNumber(client: SocketIO.Socket, number: number) {
    if (typeof number !== "number") {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate number client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateBoolean(client: SocketIO.Socket, boolean: boolean) {
    if (typeof boolean !== "boolean") {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate boolean client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateBigInt(client: SocketIO.Socket, bigInt: bigint) {
    if (typeof bigInt !== "bigint") {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate bigInt client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateObject(client: SocketIO.Socket, object: object) {
    if (typeof object !== "object") {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate object client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateArray(client: SocketIO.Socket, array: object[]) {
    if (!Array.isArray(array)) {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate array client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateUndefined(client: SocketIO.Socket, und: undefined) {
    if (und !== undefined) {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate undefined client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  validateNull(client: SocketIO.Socket, nu: null) {
    if (nu !== null) {
      client.disconnect();
      logger.error(
        "[Websocket security]",
        `Unable to validate null client: ${client.id} ${this.getClientUserId(client)}`.trim(),
      );
      return false;
    }
    return true;
  }

  private getClientUserId(client: SocketIO.Socket) {
    const userSchema = this.webSocket.getClientUserSchema(client);
    let message = "";
    if (userSchema) message = `User ID: ${userSchema._id.toString()}`;
    return message;
  }
}
