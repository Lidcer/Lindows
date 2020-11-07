export interface IWebsocketPromise<A = undefined> {
  id: string;
  resolve?: A;
  reject?: SocketError;
  status: "pending" | "rejected" | "fulfilled";
}

export interface SocketError {
  message: string;
}

export interface AppOptions {
  appName: string;
  maxConnections: number;
}
