import { WebSocket } from '../../websocket/SocketHandler';

export function setupLypeWebsocket(websocket: WebSocket) {
  websocket.on<[string]>('test', (iClient, args) => {
    console.log(iClient, args);
  });
}
