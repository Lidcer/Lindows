export interface SocketError {
  message: string;
  stack?: string;
}

export interface AppOptions {
  appName: string;
  maxConnections: number;
}
