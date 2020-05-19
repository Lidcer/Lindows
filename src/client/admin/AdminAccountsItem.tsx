import React, { Component } from 'react';
import { TOKEN_HEADER } from '../../shared/constants';
import Axios, { AxiosRequestConfig } from 'axios';
import { IResponse } from '../../shared/ApiUsersRequestsResponds';
import { withRouter, Link } from 'react-router-dom';
import { INotificationHandler } from './NotificationHandler';
import { IAdminAccount } from './AdminAccountsList';
import ReactLoading from 'react-loading';
import moment from 'moment';

interface IAdminAccountsState {
  fetching: boolean;
  account?: IAdminAccount;
}

interface IAdminAccountsProps {
  notificationHandler: INotificationHandler;
  match: {
    params: {
      accountID: string;
    };
  };
}

class AdminAccountsItem extends Component<IAdminAccountsProps, IAdminAccountsState> {
  constructor(props) {
    super(props);
    this.state = {
      fetching: false,
    };
  }

  componentDidMount() {
    this.getInfo();
  }
  get accountID() {
    return this.props.match.params.accountID;
  }

  async getInfo() {
    this.setState({ fetching: true });
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.post<IResponse<IAdminAccount>>(
        '/api/v1/admin/account',
        { accountID: this.accountID },
        axiosRequestConfig,
      );
      const account = response.data.success;
      if (account) {
        this.setState({ fetching: false, account });
      }
    } catch (error) {}

    this.setState({ fetching: false });
  }

  getAccount() {
    const account = this.state.account;
    if (!account) return <div>Account not found</div>;
    return (
      <div className={`m-2 p-2 event-log border`}>
        <div>
          {account.avatar ? (
            <>
              <img className='account-avatar' src={account.avatar} /> {account.avatar}
            </>
          ) : (
            'Avatar: none'
          )}
        </div>
        <div>Username: {account.username}</div>
        <div>displayedName: {account.displayedName}</div>
        <div>compromised: {account.compromised}</div>
        <div>banned: {account.banned}</div>
        <div>
          createdAt:
          <div>
            createdAt: {moment(account.createdAt).format('MMMM Do YYYY, HH:mm:ss')}{' '}
            {moment(account.createdAt).fromNow()}
          </div>
        </div>
        <div>
          lastOnlineAt:
          <div>
            createdAt: {moment(account.lastOnlineAt).format('MMMM Do YYYY, HH:mm:ss')}{' '}
            {moment(account.lastOnlineAt).fromNow()}
          </div>
        </div>
        <div>email: {account.email}</div>
        <div>verified: {`${account.verified}`}</div>
        <div>ips: {account.ip}</div>
        <div>roles: {account.roles}</div>
        <div>flags: {account.flags}</div>
        <button className='btn btn-terminal'>Flag</button>
        <button className='btn btn-terminal'>Ban</button>
        <button className='btn btn-terminal'>Delete</button>
        <button className='btn btn-terminal'>RemoveVerification</button>
        <button className='btn btn-terminal'>Password reset</button>
        <button className='btn btn-terminal'>Finger</button>
      </div>
    );
  }

  render() {
    if (this.state.fetching)
      return <ReactLoading className='m-2' type={'bars'} color={'#00ff00'} height={50} width={50} />;

    return (
      <div className='m-2'>
        <Link className='router-link' to={`/admin/accounts`}>
          <button className='btn btn-terminal'>Back</button>
        </Link>
        <div>{this.getAccount()}</div>
      </div>
    );
  }
}

export default withRouter(AdminAccountsItem);
