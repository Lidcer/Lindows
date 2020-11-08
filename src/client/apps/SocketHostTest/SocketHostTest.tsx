import { IManifest, BaseWindow, MessageBox } from "../BaseWindow/BaseWindow";
import React from "react";
import { SocketHostTestDiv } from "./SocketHostTestStyled";
import { NotificationSystem } from "../../components/Desktop/Notifications";
import { NetworkBaseWindow } from "../BaseWindow/NetworkBaseWindow";

interface State {
  hostId?: string;
  joinId: string;
  connected: boolean;
}

export class SocketHostTest extends NetworkBaseWindow<State> {
  public static readonly onlyOne = true;
  public notification: NotificationSystem | undefined;

  public static manifest: IManifest = {
    fullAppName: "Socket Host Test",
    launchName: "SocketHostTest",
    icon: "/assets/images/unknown-app.svg",
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 300,
        minWidth: 300,
      },
      {
        joinId: "",
        connected: false,
      },
    );
  }

  onSocketClientConnected(...args: any[]) {
    this.forceUpdate();
    console.log("onSocketClientConnected", args);
  }
  onSocketHostReceived(...args: any[]) {
    console.log("onSocketHostReceived", args);
    this.forceUpdate();
  }
  onSocketClientReceived(...args: any[]) {
    console.log("onSocketClientReceived", args);
    this.forceUpdate();
  }
  onSocketHostDisconnected(...args: any[]) {
    console.log("onSocketHostDisconnected", args);
    this.setVariables({ hostId: undefined, joinId: undefined, connected: false });
  }
  onSocketClientDisconnect(...args: any[]) {
    console.log("onSocketClientDisconnected", args);
  }
  onSocketConnectionDestroy(...args: any[]) {
    console.log("onSocketConnectionDestroy", args);
    this.setVariables({ hostId: undefined, joinId: undefined, connected: false });
  }

  startHost = async () => {
    try {
      const hostId = await this.host(99);
      this.setVariables({ hostId });
      console.log(hostId);
    } catch (error) {
      MessageBox.Show(this, error.message);
    }
  };

  joinHost = async () => {
    const id = this.variables.joinId;
    try {
      await this.connectHost(id);
      this.setVariables({ connected: true });
    } catch (error) {
      MessageBox.Show(this, error.message);
    }
  };

  get clientList() {
    const list = this.clients.map((c, i) => {
      return (
        <div key={i}>
          <span>{c.id}</span>
          <button onClick={() => c.disconnect()}>disconnect</button>
        </div>
      );
    });
    return list;
  }

  renderInside() {
    const hostId = this.variables.hostId;
    const hostButton = hostId ? <div>{hostId}</div> : <button onClick={this.startHost}>Host</button>;
    const join = hostId ? (
      <div>test</div>
    ) : (
      <>
        <input
          type='text'
          value={this.variables.joinId}
          onChange={e => this.setVariables({ joinId: e.target.value })}
        />
        <button onClick={this.joinHost}>Join</button>
      </>
    );
    const rend = !this.variables.connected ? (
      <>
        <div>{hostButton}</div>
        <div>{join}</div>
      </>
    ) : (
      <div>Open console for debug</div>
    );
    return (
      <SocketHostTestDiv>
        {rend}
        <div>
          <span>Clients:</span>
          {this.clientList}
        </div>
      </SocketHostTestDiv>
    );
  }
}
