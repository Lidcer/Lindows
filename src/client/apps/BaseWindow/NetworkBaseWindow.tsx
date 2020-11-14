import { removeFromArray } from "../../../shared/utils";
import { AppOptions } from "../../../shared/Websocket";
import { ClientSocket } from "../../services/system/NetworkSystem";
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
    if (!STATIC) {
      this.network.on("connection", this._connectionChange);
      this.network.on("disconnect", this._connectionChange);
    }
  }

  closingNew() {
    if (this.closing2) {
      try {
        this.closing2();
      } catch (error) {
        DEV && console.log(error);
      }
    }
    if (!STATIC) {
      this.network.on("connection", this._connectionChange);
      this.network.on("disconnect", this._connectionChange);
    }

    if (this._hostId) {
      this.destroyHost();
    }
    if (this._connectionId) {
      this.disconnectHost();
    }
  }

  emit(...args: any[]) {
    if (this.connectionId && this.network.connected) {
      const arg = ["app-client-emit", this.connectionId, ...args];
      return this.network.emitPromise.apply(this.network, arg);
    }
    return null;
  }

  broadcastServer(...args: any[]) {
    if (this.network.connected) {
      const arg = ["app-host-broadcast", ...args];
      this.network.emit.apply(this.network, arg);
    }
  }
  broadcast(...args: any[]) {
    if (this.network.connected) {
      for (const client of this.clients) {
        const arg = ["app-host-broadcast", client.id, ...args];
        this.network.emit.apply(this.network, arg);
      }
    }
  }
  private _connectionChange() {
    if (!this.network.connected) {
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
    console.log(2);
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
      client.markAsDisconnected();
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
    if (this.onSocketHostReceived) {
      this.onSocketHostReceived.apply(this, args);
    }
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
    this.network.on("app-client-on", this._onSocketClientReceived);
    this.network.on("app-client-connected", this._onClientConnected);
    this.network.on("app-client-disconnected", this._onClientDisconnect);

    this._hostId = hostId;
    return this._hostId;
  }
  destroyHost() {
    if (this._hostId) {
      this.network.emit("app-destroy");
      //this.network.removeListener("app-client-on", this._onSocketClientReceived);
      //this.network.removeListener("app-client-connected", this._onClientConnected);
      //this.network.removeListener("app-client-disconnected", this._onClientDisconnect);
      this._hostId = null;
    }
  }

  async connectHost(id: string) {
    await this.network.emitPromise<string, [string, string]>("app-connect", this.getManifest().fullAppName, id);
    this._connectionId = id;
    this.network.on("app-host-on", this._onSocketHostReceived);
    this.network.on("app-destroyed", this._onHostDisconnected);
  }
  async disconnectHost() {
    if (this._connectionId) {
      try {
        await this.network.emitPromise<string, [string]>("app-disconnet", this._connectionId);
      } catch (_) {
        /* ignored */
      }
      //this.network.removeListener("app-host-on", this._onSocketHostReceived);
      //this.network.removeListener("app-destroyed", this._onHostDisconnected);
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

export class AppClient {
  private _disconnected = false;
  constructor(private network: ClientSocket, private _id: string) {}

  /** send something to client
   * @param args
   */
  async emit<T extends any[]>(...args: T): Promise<boolean> {
    if (this.network.connected) {
      const arg = ["app-host-emit", this._id, ...args];
      try {
        await this.network.emitPromise.apply(this.network, arg);
      } catch (error) {
        this.markAsDisconnected();
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
  /** Disconnect client
   * @param args
   */
  async disconnect() {
    if (this.network.connected) {
      await this.network.emitPromise("app-host-disconnect-client", this.id);
      return true;
    } else {
      return false;
    }
  }
  get id() {
    return this._id;
  }
  get disconnected() {
    return this._disconnected;
  }
  markAsDisconnected() {
    this._disconnected = true;
  }
}
