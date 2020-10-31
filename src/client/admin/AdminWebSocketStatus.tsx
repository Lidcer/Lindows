import React, { Component } from "react";
import { IAccount } from "../../shared/ApiUsersRequestsResponds";
import { IAdminWebSocket } from "./Websocket";

interface IAAdminWebSocketStatusState {
  connected: boolean;
  ping?: number;
}

interface IAdminWebSocketStatusProps {
  adminWebSocket: IAdminWebSocket;
}

export default class AdminWebSocketStatus extends Component<IAdminWebSocketStatusProps, IAAdminWebSocketStatusState> {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
    };
  }

  connection = () => {
    this.setState({ connected: true });
  };
  disconnect = () => {
    this.setState({ connected: false, ping: undefined });
  };
  ping = (ping: number) => {
    this.setState({ ping });
  };

  componentDidMount() {
    this.props.adminWebSocket.socket.on("connect", this.connection);
    this.props.adminWebSocket.socket.on("disconnect", this.disconnect);
    this.props.adminWebSocket.on("ping", this.ping);
  }

  componentWillUnmount() {
    this.props.adminWebSocket.socket.removeListener("connect", this.connection);
    this.props.adminWebSocket.socket.removeListener("disconnect", this.disconnect);
    this.props.adminWebSocket.removeListener("ping", this.ping);
  }

  get webSocketId() {
    if (this.props.adminWebSocket?.socket?.id) {
      return this.props.adminWebSocket.socket.id;
    }
    return null;
  }

  render() {
    return (
      <div
        title={this.webSocketId}
        className={`admin-websocket ${this.state.connected ? "admin-websocket-online" : "admin-websocket-offline"}`}
      >
        <div>
          <b>Websocket:</b> {this.state.connected ? "Online" : "Offline"}
        </div>
        {this.state.ping ? (
          <div>
            <b>Ping:</b> {this.state.ping} ms
          </div>
        ) : null}
      </div>
    );
  }
}
