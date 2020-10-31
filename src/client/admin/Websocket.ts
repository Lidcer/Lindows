import io from "socket.io-client";
import { EventEmitter } from "events";
import { IEventLog } from "./AdminEventLogList";
import { IAdminAccount } from "./AdminAccountsList";
import { SECOND } from "../../shared/constants";
import fingerprintjs from "fingerprintjs2";
import { attachToWindowIfDev } from "../essential/requests";
import { INotificationHandler } from "./NotificationHandler";

export declare interface IAdminWebSocket {
  on(event: "ping", listener: (number: number) => void): this;
  on(event: "event-log", listener: (eventLog?: IEventLog) => void): this;
  on(event: "account", listener: (eventLog?: IAdminAccount) => void): this;
}

export class IAdminWebSocket extends EventEmitter {
  private _socket: SocketIOClient.Socket;
  private pingNow = 0;
  private timeoutFunction: NodeJS.Timeout | undefined;

  constructor(private notificationHandler: INotificationHandler) {
    super();
    attachToWindowIfDev("websocket", this);
  }

  connect = async () => {
    return new Promise<void>(resolve => {
      const replaceLink = (link: string) => {
        link = link.replace(/\${origin}/g, origin);
        link = link.replace(/\${location.host}/g, location.host);
        link = link.replace(/\${location.hostname}/g, location.hostname);
        return link;
      };
      this._socket = io(origin);
      this._socket.on("connect", () => {
        this.connection();
        resolve();
      });

      this._socket.on("ping-response", () => {
        const ping = Date.now() - this.pingNow;
        this.emit("ping", ping);

        this.timeoutFunction = setTimeout(() => {
          this.sendPing();
        }, SECOND * 5);
      });
      this._socket.on("redirect", (redirectLink: string) => {
        this.notificationHandler.warn(
          "WebSocket Guard",
          `Redirection to ${replaceLink(redirectLink)} has been blocked`,
        );
      });
      this._socket.on("disconnect", () => {
        this.notificationHandler.danger("WebSocket connection", "Websocket connection has been lost");
      });
      this._socket.on("authenticate-success", (message: string) => {
        this.notificationHandler.info("WebSocket connection", message);
      });
      this._socket.on("open-new-tab", (redirectLink: string) => {
        this.notificationHandler.warn(
          "WebSocket Guard",
          `Opening new tab ${replaceLink(redirectLink)} has been blocked`,
        );
      });
      this._socket.on("close-new-tab", (link: string) => {
        this.notificationHandler.warn("WebSocket Guard", `Closing new tab ${replaceLink(link)} has been blocked`);
      });
      this._socket.on("authenticate-failed", (message: string) => {
        this.notificationHandler.danger("WebSocket Error", message);
      });
      this._socket.on("take-fingerprint", (message: string) => {
        this.notificationHandler.warn("Finger printer", `You've been fingerprinted`);
        fingerprintjs.get(result => {
          this._socket.emit("fingerprint-result", result);
        });
      });

      //remove
      this._socket.on("admin-event-log-report", (eventLog?: IEventLog) => {
        if (eventLog) {
          if (eventLog.type === "fatal" || eventLog.type === "error") {
            this.notificationHandler.danger(`Event Log ${eventLog.type.toUpperCase()}`, eventLog.message);
          } else {
            this.notificationHandler.warn(`Event Log ${eventLog.type.toUpperCase()}`, eventLog.message);
          }
          this.emit("event-log", eventLog);
        } else this.emit("event-log");
      });

      this._socket.on("admin-account-report", (account?: IAdminAccount) => {
        if (account) {
          this.notificationHandler.warn(
            "New account",
            `New account has been created ${account.username.toUpperCase()}`,
          );
          this.emit("account", account);
        } else this.emit("account");
      });
    });
  };

  sendPing = () => {
    if (this.timeoutFunction) {
      clearTimeout(this.timeoutFunction);
      this.timeoutFunction = undefined;
    }
    if (this.socket.connected) {
      this.pingNow = Date.now();
      this.socket.emit("ping-request");
    } else {
      this.timeoutFunction = setTimeout(() => {
        this.sendPing();
      }, SECOND);
    }
  };

  destroy() {
    if (this.timeoutFunction) {
      clearTimeout(this.timeoutFunction);
      this.timeoutFunction = undefined;
    }
    this._socket.disconnect();
  }

  connection = () => {
    this.notificationHandler.info("WebSocket connection", "Websocket connection has been established");
    this.sendPing();
    const token = localStorage.getItem("auth");
    if (token) {
      this.socket.emit("authenticate", token);
    } else {
      this.notificationHandler.danger("WebSocket Warn", "Cannot authenticate Websocket missing token");
    }

    //this.socket.emit('fingerprinter', services.fingerprinter.allResults);
  };

  get socket() {
    return this._socket;
  }
}
