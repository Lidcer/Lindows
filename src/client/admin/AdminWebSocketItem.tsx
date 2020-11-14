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
//import { saveAs } from "file-save";

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
  inProgress: boolean;
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
      inProgress: false,
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
    } catch (error) {
      this.props.notificationHandler.warn("Request Failed", (error && error.message) || "Unknown error");
    }
    this.setState({ fetching: false });
  }

  get fingerPrint() {
    if (!this.state.websocket.fingerprint) return;
    return <AdminFingerprint fingerprintData={this.state.websocket.fingerprint} />;
  }

  sendNotification = async () => {
    this.setState({ inProgress: true });
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
      this.props.notificationHandler.info("Request success", response.data.success);
    } catch (error) {
      console.error(error);
      this.props.notificationHandler.warn("Request Failed", (error && error.message) || "Unknown error");
    }
    this.setState({ inProgress: false });
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
    } catch (error) {
      console.error(error);
      this.props.notificationHandler.warn("Request Failed", (error && error.message) || "Unknown error");
    }
  };
  fingerPrintSocket = async () => {
    this.setState({ inProgress: true });
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.post<IResponse<Fingerprint2.Component[]>>(
        "/api/v1/admin/fingerprint-socket",
        { socketID: this.webSocketID },
        axiosRequestConfig,
      );
      if (!this.mounted) return;

      const state = { ...this.state };
      state.websocket.fingerprint = response.data.success;
      this.setState(state);
    } catch (error) {
      console.error(error);
      this.props.notificationHandler.warn("Request Failed", (error && error.message) || "Unknown error");
    }
    this.setState({ inProgress: false });
  };
  takeScreenshotSocket = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    this.setState({ inProgress: true });
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const shiftKey = event.shiftKey;
      const response = await Axios.post<IResponse<string>>(
        `/api/v1/admin/screenshot-socket${shiftKey ? "-guess" : ""}`,
        { socketID: this.webSocketID },
        axiosRequestConfig,
      );
      if (!this.mounted) return;
      const state = { ...this.state };
      const image = new Image();
      image.src = response.data.success;

      const w = window.open("");
      w.document.write(image.outerHTML);
      // const result = await fetch(response.data.success);
      // //console.log(response.data.success);
      // console.log(response)
      // window.open(result.url);
      this.setState(state);
    } catch (error) {
      console.error(error);
      this.props.notificationHandler.warn("Request Failed", (error && error.message) || "Unknown error");
    }
    this.setState({ inProgress: false });
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
      if (this.state.inProgress) {
        return <ReactLoading className='m-2' type={"bars"} color={"#00ff00"} height={50} width={50} />;
      }
      return (
        <>
          <button className='btn btn-terminal' onClick={this.fingerPrintSocket}>
            Take Fingerprint
          </button>
          <button className='btn btn-terminal' onClick={this.takeScreenshotSocket}>
            Take inbrowser-screenshot (BETA)
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
    const me = () => {
      if (this.props.adminWebSocket.socket.id === socket.id) {
        return <span>You</span>;
      }
      return null;
    };

    return (
      <div className='m-2 p-2 d-inline-block border border-terminal'>
        <h1>{me()}</h1>
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
