import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Pages

import './Admin.scss';
import { PopupRenderer } from '../components/Popup/popupRenderer';
import Axios, { AxiosRequestConfig } from 'axios';
import { TOKEN_HEADER } from '../../shared/constants';
import { IAccountResponse, IAccount } from '../../shared/ApiUsersRequestsResponds';
import NavigationBarAdmin from './NaviBar';
import AdminHome from './Home';
import { IAdminWebSocket } from './Websocket';
import AdminEventLogRouter from './AdminEventLogRouter';
import { INotificationHandler } from './NotificationHandler';
import AdminNotification from './Notification';
import { AdminAccountsRouter } from './AdminAccountsRouter';
import { AdminWebSocketRouter } from './AdminWebSocketRouter';
interface IAdminState {
  isAdmin: boolean;
  message: string;
  account?: IAccount;
}

export class Admin extends React.Component<{}, IAdminState> {
  private notificationHandler = new INotificationHandler();
  private adminWebSocket = new IAdminWebSocket(this.notificationHandler);
  constructor(props) {
    super(props);
    this.state = {
      isAdmin: false,
      message: 'Checking...',
    };
  }

  async componentDidMount() {
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    try {
      const response = await Axios.get<IAccountResponse>('/api/v1/admin/check-admin', axiosRequestConfig);
      this.adminWebSocket.connect();
      this.setState({ isAdmin: true, account: response.data.success });
    } catch (error) {
      this.setState({ message: 'Forbidden' });
      location.href = origin;
    }
  }
  render() {
    if (!this.state.isAdmin) return <div className='m-2'>{this.state.message}</div>;

    return (
      <>
        <BrowserRouter>
          <NavigationBarAdmin account={this.state.account} adminWebSocket={this.adminWebSocket} />
          <AdminNotification notificationHandler={this.notificationHandler} />
          <Switch>
            <Route exact path='/admin/' component={AdminHome} />
            <Route
              path='/admin/event-log'
              component={() => (
                <AdminEventLogRouter
                  adminWebSocket={this.adminWebSocket}
                  notificationHandler={this.notificationHandler}
                />
              )}
            />
            <Route
              path='/admin/accounts'
              component={() => (
                <AdminAccountsRouter
                  notificationHandler={this.notificationHandler}
                  adminWebSocket={this.adminWebSocket}
                />
              )}
            />
            <Route
              path='/admin/web-sockets'
              component={() => (
                <AdminWebSocketRouter
                  notificationHandler={this.notificationHandler}
                  adminWebSocket={this.adminWebSocket}
                />
              )}
            />
          </Switch>
        </BrowserRouter>
        <PopupRenderer />
      </>
    );
  }
}
