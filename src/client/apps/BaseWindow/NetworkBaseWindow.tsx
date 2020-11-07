import { removeFromArray } from "../../../shared/utils";
import { AppOptions } from "../../../shared/Websocket";
import { Network } from "../../services/system/NetworkSystem";
import { BaseWindow, IBaseWindowProps, IWindow } from "./BaseWindow";

export interface NetworkBaseWindow<B = {}> extends BaseWindow<B> {
  onSocketClientConnected?(client: AppClient): void;
  onSocketClientDisconnect?(client: AppClient): void;
  onSocketClientReceived?<T extends any[]>(client: AppClient, ...args: T): void;
  onSocketHostReceived?<T extends any[]>(...args: T): void;
  onSocketHostDisconnected?(): void;
  onSocketConnectionDestroy?(): void;
}
export class NetworkBaseWindow<B = {}> extends BaseWindow<B> {
  private _hostId: string | null = null;
  private _connectionId: string | null = null;
  private _clients: AppClient[] = [];

  constructor(props: IBaseWindowProps, options?: IWindow, variables?: Readonly<B>) {
    super(props, options, variables);
    if (this.closing) {
      this.closing2 = this.closing;
    }
    this.closing = this.closingNew;

    if (this.shown) {
      this.shown2 = this.shown;
      this.shown = this.shownNew;
    }
    this.shown = this.shownNew;
  }

  shown2() {}
  closing2() {}

  shownNew() {
    if (this.shown2) {
      try {
        this.shown2();
      } catch (error) {
        DEV && console.log(error);
      }
    }
    this.network.socket.on("connection", this._connectionChange);
    this.network.socket.on("disconnect", this._connectionChange);
  }

  closingNew() {
    if (this.closing2) {
      try {
        this.closing2();
      } catch (error) {
        DEV && console.log(error);
      }
    }
    this.network.socket.on("connection", this._connectionChange);
    this.network.socket.on("disconnect", this._connectionChange);

    if (this._hostId) {
      this.destroyHost();
    }
    if (this._connectionId) {
      this.disconnectHost();
    }
  }

  emit(...args: any[]) {
    if (this.connectionId && this.network.socket.connected) {
      const arg = ["app-client-emit", this.connectionId, ...args];
      return this.network.emitPromise.apply(this.network, arg);
    }
    return null;
  }

  private _connectionChange() {
    if (!this.network.socket.connected) {
      if (this._connectionId) {
        this._connectionId = null;
        if (this.onSocketHostDisconnected) {
          this.onSocketHostDisconnected();
        }
      }
      if (this._hostId) {
        this._hostId = null;
        if (this.onSocketConnectionDestroy) {
          this.onSocketConnectionDestroy();
        }
      }
    }
  }

  private _onHostDisconnected = (id: string) => {
    if (this._connectionId !== id) return;
    this._connectionId = null;
    if (this.onSocketHostDisconnected) {
      this.onSocketHostDisconnected();
    }
  };
  private _onClientConnected = (id: string) => {
    const c = new AppClient(this.network, id);
    this._clients.push(c);
    if (this.onSocketClientConnected) {
      this.onSocketClientConnected(c);
    }
  };
  private _onClientDisconnect = (id: string) => {
    const client = this.getClientByID(id);
    if (client) {
      removeFromArray(this._clients, client);
      if (this.onSocketClientDisconnect) {
        this.onSocketClientDisconnect(client);
      }
    }
  };
  private _onSocketClientReceived = (id: string, ...args: any[]) => {
    if (this.onSocketClientReceived) {
      const client = this.getClientByID(id);
      const a = [client, ...args];
      this.onSocketClientReceived.apply(this, a);
    }
  };
  private _onSocketHostReceived = (appName: string, gameId: string, ...args: any[]) => {
    if (appName !== this.getManifest().fullAppName) return;
    if (this._connectionId !== gameId) return;
    this.onSocketHostReceived.apply(this, args);
  };

  getClientByID(id: string) {
    return this._clients.find(c => c.id === id);
  }

  async host(maxConnections: number) {
    if (this._connectionId) throw new Error("You are connected you cannot host!");
    if (this._hostId) return this._hostId;

    const appOptions: AppOptions = {
      appName: this.getManifest().fullAppName,
      maxConnections,
    };
    const hostId = await this.network.emitPromise<string, [AppOptions]>("app-host", appOptions);
    this.network.socket.on("app-client-on", this._onSocketClientReceived);
    this.network.socket.on("app-client-connected", this._onClientConnected);
    this.network.socket.on("app-client-disconnected", this._onClientDisconnect);

    this._hostId = hostId;
    return this._hostId;
  }
  destroyHost() {
    if (this._hostId) {
      this.network.socket.emit("app-destroy");
      this.network.socket.removeListener("app-client-on", this._onSocketClientReceived);
      this.network.socket.removeListener("app-client-connected", this._onClientConnected);
      this.network.socket.removeListener("app-client-disconnected", this._onClientDisconnect);
      this._hostId = null;
    }
  }

  async connectHost(id: string) {
    await this.network.emitPromise<string, [string, string]>("app-connect", this.getManifest().fullAppName, id);
    this._connectionId = id;
    this.network.socket.on("app-host-on", this._onSocketHostReceived);
    this.network.socket.on("app-destroyed", this._onHostDisconnected);
  }
  async disconnectHost() {
    if (this._connectionId) {
      await this.network.emitPromise<string, [string]>("app-disconnet", this._connectionId);
      this.network.socket.removeListener("app-host-on", this._onSocketHostReceived);
      this.network.socket.removeListener("app-destroyed", this._onHostDisconnected);
      this._connectionId = null;
    }
  }

  get clients() {
    return [...this._clients];
  }
  /**
   *  get host id if exist
   * @returns {String}
   */
  get hostId() {
    return this._hostId;
  }
  /**
   *  get connection id if exist
   * @returns {String}
   */
  get connectionId() {
    return this._connectionId;
  }
}

class AppClient {
  constructor(private network: Network, private _id: string) {}

  /** send something to client
   * @param args
   */
  async emit<T = any>(object: T[]): Promise<boolean> {
    if (this.network.socket.connected) {
      await this.network.emitPromise("app-host-emit", this._id, object);
      return true;
    } else {
      return false;
    }
  }
  /** Disconnect client
   * @param args
   */
  async disconnect() {
    if (this.network.socket.connected) {
      await this.network.emitPromise("app-host-disconnect-client", this.id);
      return true;
    } else {
      return false;
    }
  }
  get id() {
    return this._id;
  }
}
