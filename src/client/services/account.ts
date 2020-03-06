import { EventEmitter } from 'events';
import Axios, { AxiosRequestConfig } from 'axios';
import { TOKEN_HEADER } from '../../shared/constants';
import { IAccountLoginRequest } from '../../shared/ApiRequests';

export interface IAccountInfo {
  accountId: string;
  username: string;
  email: string;
  avatar: string | null;
}

declare interface IAccount {
  on(event: 'ready', listener: (accountInfo: IAccountInfo | null) => void): this;
  on(event: 'login', listener: (accountInfo: IAccountInfo) => void): this;
  on(event: 'logout', listener: () => void): this;
}

class IAccount extends EventEmitter {
  private _token = '';
  private accountId: string;
  private username: string;
  private email: string;
  private avatar: string = null;

  constructor() {
    super();
    this._token = this.token;

    this.checkAccount().finally(() => {
      this.emit('ready', this.account);
    });
  }

  private get token() {
    this._token = localStorage.getItem('auth');
    return this._token;
  }

  private checkAccount(): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!this.token) return reject(new Error('Missing token'));

      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      axiosRequestConfig.headers[TOKEN_HEADER] = this.token;

      Axios.get('/api/v1/users/checkAccount', axiosRequestConfig)
        .then(response => {
          if (response && response.data && typeof response.data === 'object') {
            this.avatar = response.data.avatar || null;
            this.username = response.data.username;
            this.email = response.data.email;
            this.accountId = response.data.accountId;
          }
          resolve(this.account);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  private setToken(token: string) {
    this._token = token;
    localStorage.setItem('auth', token);
    return this;
  }

  loginWithToken(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!token) token = this._token;
      else this._token = token;
      if (!token) return reject(new Error('Token not provided'));
    });
  }

  login(usernameOrEmail: string, password: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!usernameOrEmail) return reject('Username or mail has not been provided');
      if (!password) return reject('Password has not been provided');

      const accountLoginRequest: IAccountLoginRequest = {
        email: usernameOrEmail,
        password: password,
        username: usernameOrEmail,
      };

      Axios.post('/api/v1/users/login', accountLoginRequest)
        .then(response => {
          const token = response.headers[TOKEN_HEADER];
          //const body:IAccountLoginResponse
          if (token) {
            this.setToken(token);
            //TODO: Initialize account;
            this.emit('login', this.account);
            resolve(this.account);
          } else {
            reject(new Error('Did get token from server'));
          }
        })
        .catch((error: any) => {
          if (error && error.response && error.response.data && error.response.data.error) {
            reject(new Error(error.response.data.error));
          } else {
            reject(new Error('Internal server error'));
          }
        });
    });
  }

  public logout() {
    this.username = undefined;
    this.accountId = undefined;
    this.email = undefined;
    this.avatar = undefined;
    this.emit('logout');
  }

  public get account(): IAccountInfo {
    if (this.username) return null;
    return {
      accountId: this.accountId,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
    };
  }
}

export const account = new Account();
