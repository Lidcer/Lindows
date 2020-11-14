//SocketIO.Socket

import { IWebsocketPromise } from "../../shared/Promise";
import { logger } from "../database/EventLog";
import { Client } from "./Client";
import { WebSocket } from "./SocketHandler";

export class SocketValidator {
  constructor(private webSocket: WebSocket) {}

  validateWebSocketPromise(client: Client, promise: IWebsocketPromise) {
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

  validateString(client: Client, string: string) {
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

  validateNumber(client: Client, number: number) {
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

  validateBoolean(client: Client, boolean: boolean) {
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

  validateBigInt(client: Client, bigInt: bigint) {
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

  validateObject(client: Client, object: object) {
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

  validateArray(client: Client, array: object[]) {
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

  validateUndefined(client: Client, und: undefined) {
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

  validateNull(client: Client, nu: null) {
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

  private getClientUserId(client: Client) {
    const userSchema = client.userModifiable;
    let message = "";
    if (userSchema) message = `User ID: ${userSchema.id.toString()}`;
    return message;
  }
}
