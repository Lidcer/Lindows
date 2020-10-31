import { WebSocket } from "../../websocket/SocketHandler";
import { logger } from "../../database/EventLog";

export function setupAdminWebsocket(websocket: WebSocket) {
  // websocket.on<string, string>('admin-broadcast', (client, value, link) => {
  //   if (!websocket.socketValidator.validateString(client, value)) return;
  //   if (!websocket.socketValidator.validateString(client, link)) return;
  //   const userSchema = websocket.getClientUserSchema(client);
  //   if (!userSchema) return;
  //   if (userSchema.roles.includes('admin') || userSchema.roles.includes('superadmin')) {
  //     return websocket.broadcast(value, link);
  //   }
  //   logger.warn(`User ${userSchema.username} tried to broadcast but failed because of lack of permission`);
  // });
  // websocket.on<string, string>('admin-disonnect-socket', (client, value, link) => {
  //   const userSchema = websocket.getClientUserSchema(client);
  //   if (!userSchema) return;
  //   if (userSchema.roles.includes('admin') || userSchema.roles.includes('superadmin')) {
  //     return websocket.broadcast(value, link);
  //   }
  //   logger.warn(`User ${userSchema.username} tried to broadcast but failed because of lack of permission`);
  // });
}
