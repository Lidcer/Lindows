import React, { Component } from "react";
import { IAdminWebSocket } from "./Websocket";
import { withRouter, Link } from "react-router-dom";
import { INotificationHandler } from "./NotificationHandler";
import { IAdminAccount } from "./AdminAccountsList";
import Axios, { AxiosRequestConfig } from "axios";
import { TOKEN_HEADER } from "../../shared/constants";
import { IResponse } from "../../shared/ApiUsersRequestsResponds";
import ReactLoading from "react-loading";
import AdminFingerprint from "./AdminFingerprint";

interface IWebSocketInfo {
  id: string;
  ip: string;
  active: boolean;
  account?: IAdminAccount;
  fingerprint?: Fingerprint2.Component[];
}

interface IAdminWebSocketItemState {
  connected: boolean;
  fetching: boolean;
  fingerprinting: boolean;
  websocket?: IWebSocketInfo;
}

interface IAdminWebSocketItemProps {
  adminWebSocket: IAdminWebSocket;
  notificationHandler: INotificationHandler;
  match: {
    params: {
      websocketID: string;
    };
  };
}

class AdminWebSocketItem extends Component<IAdminWebSocketItemProps, IAdminWebSocketItemState> {
  private mounted = false;
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      fetching: false,
      fingerprinting: false,
    };
  }

  componentDidMount() {
    this.mounted = true;
    this.getInfo();
    //this.props.adminWebSocket.socket.on('connect', this.connection);
    //this.props.adminWebSocket.socket.on('disconnect', this.disconnect);
    //this.props.adminWebSocket.on('ping', this.ping);
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  get webSocketID() {
    return this.props.match.params.websocketID;
  }

  async getInfo() {
    this.setState({ fetching: true });
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.post<IResponse<IWebSocketInfo>>(
        "/api/v1/admin/web-socket-info",
        { socketID: this.webSocketID },
        axiosRequestConfig,
      );
      if (!this.mounted) return;
      this.setState({ websocket: response.data.success });
    } catch (error) {}
    this.setState({ fetching: false });
  }

  get fingerPrint() {
    if (!this.state.websocket.fingerprint) return;
    return <AdminFingerprint fingerprintData={this.state.websocket.fingerprint} />;
  }

  sendNotification = async () => {
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    const notification = prompt() || "";
    if (!notification) return;

    try {
      const response = await Axios.post<IResponse<string>>(
        "/api/v1/admin/notify-socket",
        { socketID: this.webSocketID, notification },
        axiosRequestConfig,
      );
      if (!this.mounted) return;
    } catch (error) {}
  };
  redirect = async () => {
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    const redirect = prompt() || "";
    if (!redirect) return;
    try {
      await Axios.post<IResponse<string>>(
        "/api/v1/admin/redirect-socket",
        { socketID: this.webSocketID, redirect },
        axiosRequestConfig,
      );
      if (!this.mounted) return;
    } catch (error) {}
  };
  fingerPrintSocket = async () => {
    this.setState({ fingerprinting: true });
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.post<IResponse<IWebSocketInfo>>(
        "/api/v1/admin/fingerprint-socket",
        { socketID: this.webSocketID },
        axiosRequestConfig,
      );
      if (!this.mounted) return;
      this.setState({ websocket: response.data.success });
    } catch (error) {}
    this.setState({ fingerprinting: false });
  };

  get webSocket() {
    const socket = this.state.websocket;
    if (!socket) return <div className='p-2 event-log border border-terminal d-inline-block'>Socket not found</div>;

    const getAccount = () => {
      if (!socket.account) return <div> Anonymous </div>;
      return (
        <div className='m-2 p-2 d-inline-block border border-terminal'>
          <div>
            <b>ID: </b> {socket.account.id}
          </div>

          <div>
            <b>Username: </b> {socket.account.username}
          </div>
          <div>
            <b>DisplayedName: </b> {socket.account.displayedName}
          </div>
          <div>
            <b>Email: </b> {socket.account.email}
          </div>
          <Link to={`/admin/accounts/${socket.account.id}`}>
            <button className='btn btn-terminal'>Full Info</button>
          </Link>
        </div>
      );
    };

    const fingerprint = () => {
      if (this.state.fingerprinting) {
        return <ReactLoading className='m-2' type={"bars"} color={"#00ff00"} height={50} width={50} />;
      }
      return (
        <>
          <button className='btn btn-terminal' onClick={this.fingerPrintSocket}>
            Take Fingerprint
          </button>
          <button className='btn btn-terminal' onClick={this.sendNotification}>
            Send Notification
          </button>
          <button className='btn btn-terminal' onClick={this.redirect}>
            Redirect
          </button>
          <button className='btn btn-terminal'>Disconnect</button>
        </>
      );
    };

    return (
      <div className='m-2 p-2 d-inline-block border border-terminal'>
        <h1>{socket.id}</h1>
        <h1>{socket.ip}</h1>
        {getAccount()}
        {this.fingerPrint}
        <div>{fingerprint()}</div>
      </div>
    );
  }

  render() {
    if (this.state.fetching)
      return <ReactLoading className='m-2' type={"bars"} color={"#00ff00"} height={50} width={50} />;

    return (
      <>
        <Link className='router-link' to={`/admin/web-sockets`}>
          <button className='btn btn-terminal'>Back</button>
        </Link>
        <div className={`m-2 p-2 event-log`}>
          <div>{this.webSocket}</div>
        </div>
      </>
    );
  }
}

export default withRouter(AdminWebSocketItem);
