import React, { Component } from 'react';
import { IResponse } from '../../shared/ApiUsersRequestsResponds';
import Axios, { AxiosRequestConfig } from 'axios';
import { TOKEN_HEADER } from '../../shared/constants';
import Navigation from './AdminNavigation';
import { IAdminAccount } from './AdminAccountsList';
import { INotificationHandler } from './NotificationHandler';
import { withRouter, Link } from 'react-router-dom';
import ReactLoading from 'react-loading';
import { IAdminWebSocket } from './Websocket';

interface IAdminWebSocketItemState {
  broadcast: string;
  redirect: string;
  newTab: string;
  closeTab: string;
  broadcastArg0: string;
  broadcastArg1: string;
  broadcastArg2: string;
  refreshing: boolean;
  webSocketInfo: IWebSocketInfo[];
  page: number;
  tab: 'socket' | 'broadcaster';
}

interface IWebSocketInfo {
  id: string;
  account?: IAdminAccount;
}

interface IWebSocketInfoData {
  webSocketInfo: IWebSocketInfo[];
  date?: Date;
}

export const webSocketData: IWebSocketInfoData = {
  webSocketInfo: [],
};

interface IWebSocketBroadcast {
  value: string;
  arg0: string;
  arg1?: string;
  arg2?: string;
}

interface IAdminWebSocketItemProps {
  notificationHandler: INotificationHandler;
  adminWebSocket: IAdminWebSocket;
  match?: {
    params: {
      websocketID: string;
    };
  };
}

export class AdminWebSocketMain extends Component<IAdminWebSocketItemProps, IAdminWebSocketItemState> {
  constructor(props) {
    super(props);
    this.state = {
      webSocketInfo: webSocketData.webSocketInfo,
      broadcast: '',
      broadcastArg0: '',
      broadcastArg1: '',
      broadcastArg2: '',
      redirect: '',
      newTab: '',
      closeTab: '',
      refreshing: false,
      tab: 'socket',
      page: 0,
    };
  }

  componentDidMount() {
    this.getInfo();
  }
  get websocketID() {
    return this.props.match.params.websocketID;
  }

  async getInfo() {
    this.setState({ refreshing: true });
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.get<IResponse<IWebSocketInfo[]>>(
        '/api/v1/admin/web-sockets-info',
        axiosRequestConfig,
      );
      const webSocketInfo = response.data.success;
      this.setState({ webSocketInfo });
    } catch (error) {
      console.error(error);
    }
    this.setState({ refreshing: false });
  }

  async broadcast(value: string, arg0: string, arg1?: string, arg2?: string) {
    this.setState({ refreshing: true });
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    const socketBroadcast: IWebSocketBroadcast = { value, arg0, arg1, arg2 };

    try {
      const response = await Axios.post<IResponse<string>>(
        '/api/v1/admin/socket-broadcast',
        socketBroadcast,
        axiosRequestConfig,
      );
      this.props.notificationHandler.info('Broadcast sent', response.data.success);
    } catch (error) {
      this.setState({ refreshing: false });
      console.error(error);
      this.props.notificationHandler.info('Broadcast Error', `Failed to broadcast ${error.message}`);
      throw new Error(error);
    }
    this.setState({ refreshing: false });
  }

  sendBroadcast = async () => {
    const broadcast = this.state.broadcast;
    const broadcastArg0 = this.state.broadcastArg0 || undefined;
    const broadcastArg1 = this.state.broadcastArg1 || undefined;
    const broadcastArg2 = this.state.broadcastArg2 || undefined;
    if (!broadcast || broadcastArg1) return;
    this.setState({ broadcast: '', broadcastArg0: '', broadcastArg1: '', broadcastArg2: '' });

    try {
      await this.broadcast(broadcast, broadcastArg0, broadcastArg1, broadcastArg2);
    } catch (error) {
      this.setState({ broadcast, broadcastArg0, broadcastArg1, broadcastArg2 });
    }
  };

  redirect = async () => {
    if (!this.state.redirect) return;
    const redirect = this.state.redirect;
    this.setState({ redirect: '' });
    try {
      await this.broadcast('redirect', redirect);
    } catch (error) {
      this.setState({ redirect });
    }
  };

  openNewTab = async () => {
    if (!this.state.newTab) return;
    const newTab = this.state.newTab;
    this.setState({ newTab: '' });
    try {
      await this.broadcast('open-new-tab', newTab);
    } catch (error) {
      this.setState({ newTab });
    }
  };

  closeNewTab = async () => {
    if (!this.state.closeTab) return;
    const closeTab = this.state.closeTab;
    this.setState({ closeTab: '' });
    try {
      await this.broadcast('close-new-tab', closeTab);
    } catch (error) {
      this.setState({ newTab: closeTab });
    }
  };

  websocketPage = () => {
    const multiplayer = this.state.page !== 0 ? 10 * this.state.page : 0;
    const events = this.state.webSocketInfo.slice(0 + multiplayer, 10 + multiplayer);
    if (!events.length && this.state.page !== 0) {
      this.setState({ page: 0 });
      return null;
    }
    if (!events.length)
      return <div className='p-2 event-log border border-terminal d-inline-block'>No connection found</div>;
    return events.map((e, i) => {
      return <div key={i}> {this.getWebSocketInfo(e)} </div>;
    });
  };

  getWebSocketInfo(webSocketInfo: IWebSocketInfo) {
    const getAccountInfo = (iAccount?: IAdminAccount) => {
      if (!iAccount) return null;
      return <span>| {iAccount.username}</span>;
    };

    return (
      <Link className='router-link' to={`/admin/web-sockets/${webSocketInfo.id}`}>
        <div className={`m-2 p-2 border border-terminal admin-clickable`}>
          <div>
            {webSocketInfo.id} {getAccountInfo(webSocketInfo.account)}
          </div>
        </div>
      </Link>
    );
  }

  get refreshButton() {
    if (this.state.refreshing) {
      return <ReactLoading className='m-2' type={'bars'} color={'#00ff00'} height={50} width={50} />;
    }
    return (
      <button className='btn btn-terminal' onClick={() => this.getInfo()}>
        Refresh
      </button>
    );
  }

  render() {
    return (
      <div className='m-2 p-2'>
        {this.state.refreshing ? null : (
          <button
            className='btn btn-terminal'
            onClick={() => this.setState({ tab: this.state.tab === 'broadcaster' ? 'socket' : 'broadcaster' })}
          >
            {this.state.tab === 'broadcaster' ? 'Sockets' : 'Mics'}
          </button>
        )}
        {this.renderWebsocketInfo}
        {this.renderBroadcast}
      </div>
    );
  }

  get renderBroadcast() {
    if (this.state.tab !== 'broadcaster') return;
    return (
      <div className='m-2 p-2 border border-terminal'>
        <div>
          <div className='m-2 p-2 border border-terminal'>
            <b>Redirect all clients: </b>
            <input
              type='text'
              className='input-terminal'
              placeholder='Link'
              onChange={e => this.setState({ redirect: e.target.value })}
              value={this.state.redirect}
            />
            <button className='btn btn-terminal' onClick={() => this.redirect()}>
              Send
            </button>
          </div>
          <div className='m-2 p-2 border border-terminal'>
            <b>Open new tab on all clients: </b>
            <input
              type='text'
              className='input-terminal'
              placeholder='Link'
              onChange={e => this.setState({ newTab: e.target.value })}
              value={this.state.newTab}
            />
            <button className='btn btn-terminal' onClick={() => this.openNewTab()}>
              Send
            </button>
          </div>
          <div className='m-2 p-2 border border-terminal'>
            <b>Close new tab on all clients: </b>
            <input
              type='text'
              className='input-terminal'
              placeholder='Link'
              onChange={e => this.setState({ closeTab: e.target.value })}
              value={this.state.closeTab}
            />
            <button className='btn btn-terminal' onClick={() => this.closeNewTab()}>
              Send
            </button>
            <div className='text-danger'> Does not work on cross domain platform</div>
          </div>
          <b>Broadcast</b>
        </div>
        <input
          type='text'
          className='input-terminal'
          placeholder='type'
          onChange={e => this.setState({ broadcast: e.target.value })}
          value={this.state.broadcast}
        />
        <input
          type='text'
          className='input-terminal'
          placeholder='Arg 1'
          onChange={e => this.setState({ broadcastArg0: e.target.value })}
          value={this.state.broadcastArg0}
        />
        <input
          type='text'
          className='input-terminal'
          placeholder='Arg 2'
          onChange={e => this.setState({ broadcastArg1: e.target.value })}
          value={this.state.broadcastArg1}
        />
        <input
          type='text'
          className='input-terminal'
          placeholder='Arg 3'
          onChange={e => this.setState({ broadcastArg2: e.target.value })}
          value={this.state.broadcastArg2}
        />
        <button className='btn btn-terminal' onClick={() => this.sendBroadcast()}>
          Send
        </button>
        <div className='text-danger'> This feature can break client be aware what you are doing with it</div>
      </div>
    );
  }

  get renderWebsocketInfo() {
    if (this.state.tab !== 'socket') return;

    return (
      <div className='m-2'>
        {this.refreshButton}
        <div>
          {this.websocketPage()}
          <Navigation
            length={this.state.webSocketInfo.length}
            currentPage={this.state.page}
            onNext={() => {
              this.setState({ page: this.state.page + 1 });
            }}
            onPrevious={() => {
              this.setState({ page: this.state.page - 1 });
            }}
          />
        </div>
      </div>
    );
  }
}
