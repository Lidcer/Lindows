import { IAccountInfo } from '../account';
import { services } from '../services';
import { BaseService } from './BaseService';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TOKEN_HEADER } from '../../../shared/constants';
import { ILypeAccountResponse, ILypeAccount } from './../../../shared/ApiLypeRequestsResponds';
import { fetchImage, disassembleError } from '../../essential/requests';
import { LypeStatus } from '../../../shared/ApiUsersRequestsResponds';

export interface ILypeAccountInfo extends IAccountInfo {
  customStatus?: string;
  status: LypeStatus;
}

export enum LypeServiceState {
  Ready = 'ready',
  CreateAccount = 'createAccount',
  NotReady = 'notReady',
  NotLogined = 'notLogined',
  Loading = 'loading',
  Error = 'error',
}

export declare interface ILypeService extends BaseService {
  on(event: 'destroy', listener: () => void): this;
  on(event: 'stateChange', listener: (newState: LypeServiceState) => void): this;
}

export class ILypeService extends BaseService {
  private browserStorageKey = '__lype__';
  private serviceName = 'lype';
  private DEFAULT_AVATAR = '/assets/images/DefaultAvatar.svg';
  private _state: LypeServiceState = LypeServiceState.NotReady;
  private _friends: ILypeAccount[] = [];
  private _searchedFriends: ILypeAccount[] = [];
  private errMessage = '';

  private id = '';
  private username = '';
  private displayedName = '';
  private avatar?: string;
  private status: LypeStatus;
  private customStatus: string;

  constructor() {
    super();
    this.avatar = this.DEFAULT_AVATAR;
  }

  start = () => {
    this.actualStart();
  };

  actualStart = async () => {
    if (!services.ready) {
      services.on('allReady', this.actualStart);
      return;
    }
    services.removeListener('allReady', this.actualStart);
    services.account.on('login', this.login);
    services.account.on('logout', this.logout);
    for (const thing in LypeServiceState) {
      services.broadcaster.on(`${this.serviceName}-${thing}`, this.broadcaster);
    }

    const token = services.account.token;
    if (!token) {
      return this.setState(LypeServiceState.NotLogined);
    }

    try {
      await this.checkAccount();
    } catch (error) {}
  };

  destroy() {
    services.account.removeListener('login', this.login);
    services.account.removeListener('logout', this.logout);
    for (const thing in LypeServiceState) {
      services.broadcaster.removeListener(`${this.serviceName}-${thing}`, this.broadcaster);
    }
    this.emit('destroy');
    this.removeAllListeners();
  }

  broadcaster = () => {};

  private checkAccount(): Promise<ILypeAccountResponse> {
    return new Promise((resolve, reject) => {
      const token = services.account.token;
      if (!token) return reject(new Error('Missing token'));
      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      axiosRequestConfig.headers[TOKEN_HEADER] = token;
      this.setState(LypeServiceState.Loading);
      Axios.get<ILypeAccountResponse>('/api/v1/lype/check-lype-user', axiosRequestConfig)
        .then(async response => {
          const ok = this.disassembleResponse(response);
          if (ok) {
            this.setState(LypeServiceState.Ready);
          } else {
            this.setState(LypeServiceState.CreateAccount);
          }
          resolve();
        })
        .catch(err => {
          if (err && err.response && err.response.status && err.response.status === 401) {
            services.account.logout();
            this.setState(LypeServiceState.NotLogined);
          }
          resolve();
        });
    });
  }

  createLypeUser() {
    return new Promise((resolve, reject) => {
      const token = services.account.token;
      if (!token) return reject(new Error('Missing token'));
      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      this.setState(LypeServiceState.Loading);
      axiosRequestConfig.headers[TOKEN_HEADER] = token;
      Axios.post<ILypeAccountResponse>('/api/v1/lype/create-lype-user', undefined, axiosRequestConfig)
        .then(async response => {
          const ok = this.disassembleResponse(response);
          if (ok) {
            this.setState(LypeServiceState.Ready);
          } else {
            this.errMessage = 'Invalid data received from server';
            this.setState(LypeServiceState.Error);
          }
          resolve();
        })
        .catch(err => {
          if (err && err.response && err.response.status && err.response.status === 401) {
            services.account.logout();
            this.setState(LypeServiceState.NotLogined);
          } else {
            this.errMessage = 'Unable to check this account. Try again later';
            this.setState(LypeServiceState.Error);
          }
          resolve();
        });
    });
  }

  private login = () => {
    this.checkAccount();
  };

  private logout = () => {
    this.id = '';
    this.username = '';
    this.displayedName = '';
    this.avatar = this.DEFAULT_AVATAR;
    this.status = undefined;
    this.customStatus = undefined;
    this.setState(LypeServiceState.NotLogined);
  };

  get account(): ILypeAccountInfo | null {
    if (!this.id) return null;
    const lypeParameters: ILypeAccountInfo = {
      accountId: this.id,
      avatar: this.avatar,
      displayedName: this.displayedName,
      username: this.username,
      customStatus: this.customStatus,
      status: this.status,
    };
    return lypeParameters;
  }

  private disassembleResponse(response: AxiosResponse<ILypeAccountResponse>, token?: string): boolean {
    if (
      response &&
      response.data &&
      response.data.success &&
      response.data.success.username &&
      response.data.success.displayedName &&
      response.data.success.id &&
      response.data.success.status
    ) {
      this.avatar = response.data.success.avatar ? response.data.success.avatar : this.DEFAULT_AVATAR;
      this.username = response.data.success.username;
      this.displayedName = response.data.success.displayedName;
      this.id = response.data.success.id;
      this.status = response.data.success.status as LypeStatus;
      this.customStatus = response.data.success.customStatus;

      services.broadcaster.emit(`${this.serviceName}-login`, this.account);
    } else return false;
    return true;
  }

  setState(state: LypeServiceState) {
    if (this._state === state) return;
    if (this._state !== 'error') this.errMessage = '';
    this._state = state;
    services.broadcaster.emit(`${this.serviceName}-${state}`);
    this.emit('stateChange', this._state);
  }

  get errorMessage() {
    return this.errMessage;
  }

  get state() {
    return this._state;
  }

  get friends() {
    return this._friends;
  }

  get searchedFriends() {
    return this._searchedFriends;
  }
}
