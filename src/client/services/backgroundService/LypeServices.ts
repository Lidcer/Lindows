import { IAccountInfo } from '../account';
import { services } from '../SystemService/ServiceHandler';
import { BaseService } from './BaseService';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TOKEN_HEADER } from '../../../shared/constants';
import {
  ILypeAccountResponse,
  ILypeAccount,
  ILypeClientAccountResponse,
  IClientAccount,
  ILypeFriendsQueryResponse,
  LypeStatus,
  ILypeFriendsUserResponse,
} from '../../../shared/ApiLypeRequestsResponds';

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
  private errMessage = '';

  private id = '';
  private username = '';
  private displayedName = '';
  private avatar?: string;
  private status: LypeStatus;
  private customStatus: string;
  private _friends: ILypeAccount[] = [];
  private _friendRequest: ILypeAccount[] = [];
  private _pendingRequest: ILypeAccount[] = [];
  private _blocked: ILypeAccount[] = [];
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
    } catch (_) {
      /* ignored */
    }
  };

  destroy() {
    services.account.removeListener('login', this.login);
    services.account.removeListener('logout', this.logout);
    for (const thing in LypeServiceState) {
      services.broadcaster.removeListiner(`${this.serviceName}-${thing}`, this.broadcaster);
    }
    this.emit('destroy');
    this.removeAllListeners();
  }

  broadcaster = () => {
    /* ee */
  };

  private async checkAccount(): Promise<ILypeAccountResponse> {
    const token = services.account.token;
    if (!token) throw new Error('Missing token');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    this.setState(LypeServiceState.Loading);
    try {
      const response = await Axios.post<ILypeClientAccountResponse>(
        '/api/v1/lype/check-lype-user',
        undefined,
        axiosRequestConfig,
      );
      console.log(response);
      const ok = this.disassembleResponse(response);
      if (ok) {
        this.setState(LypeServiceState.Ready);
      } else {
        this.setState(LypeServiceState.CreateAccount);
      }
      return response.data;
    } catch (error) {
      if (error && error.response && error.response.status) {
        switch (error.response.status) {
          case 400:
          case 401:
            services.account.logout();
            this.setState(LypeServiceState.NotLogined);
            break;
        }
      }
    }
  }

  async createLypeUser() {
    const token = services.account.token;
    if (!token) throw new Error('Missing token');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    this.setState(LypeServiceState.Loading);
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    try {
      const response = await Axios.post<ILypeClientAccountResponse>(
        '/api/v1/lype/create-lype-user',
        undefined,
        axiosRequestConfig,
      );
      const ok = this.disassembleResponse(response);
      if (ok) {
        this.setState(LypeServiceState.Ready);
      } else {
        this.errMessage = 'Invalid data received from server';
        this.setState(LypeServiceState.Error);
      }
    } catch (error) {
      if (error && error.response && error.response.status) {
        switch (error.response.status) {
          case 401:
          case 400:
            services.account.logout();
            this.setState(LypeServiceState.NotLogined);
            return;
        }
      }
      this.errMessage = 'Unable to check this account. Try again later';
      this.setState(LypeServiceState.Error);
    }
  }

  async findUsers(query: string) {
    const token = services.account.token;
    if (!token) throw new Error('Missing token');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };

    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    const response = await Axios.post<ILypeFriendsQueryResponse>(
      '/api/v1/lype/find-users',
      { query },
      axiosRequestConfig,
    );
    if (Array.isArray(response.data.success.users)) {
      const filteredUsers: ILypeAccount[] = [];

      for (const user of response.data.success.users) {
        if (this.pendingRequests.find(r => r.id === user.id)) continue;
        if (this._friends.find(f => f.id === user.id)) continue;
        if (this._blocked.find(b => b.id === user.id)) continue;
        filteredUsers.push(user);
      }

      return filteredUsers;
    } else throw new Error('Invalid data received from server');
  }

  private login = () => {
    this.checkAccount();
  };

  async addOrRemoveFriend(userID: string, add: boolean) {
    const token = services.account.token;
    if (!token) throw new Error('Missing token');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };

    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    const response = await Axios.put<ILypeFriendsUserResponse>(
      `/api/v1/lype/${add ? 'add' : 'remove'}-friend`,
      { userID },
      axiosRequestConfig,
    );
    const ok = this.disassembleResponse(response);
    if (ok) {
      this.setState(LypeServiceState.Ready);
    } else {
      this.setState(LypeServiceState.CreateAccount);
    }
    return response.data;
  }

  private logout = () => {
    this.id = '';
    this.username = '';
    this.displayedName = '';
    this.avatar = this.DEFAULT_AVATAR;
    this.status = undefined;
    this.customStatus = undefined;
    this.setState(LypeServiceState.NotLogined);
  };

  get account(): IClientAccount | null {
    if (!this.id) return null;
    const lypeParameters: IClientAccount = {
      id: this.id,
      avatar: this.avatar,
      displayedName: this.displayedName,
      username: this.username,
      customStatus: this.customStatus,
      status: this.status,
      friends: this._friends,
      friendRequest: this._friendRequest,
      pendingRequest: this._pendingRequest,
      blocked: this._blocked,
    };
    return lypeParameters;
  }

  private disassembleResponse(response: AxiosResponse<ILypeClientAccountResponse>): boolean {
    if (
      response &&
      response.data &&
      response.data.success &&
      response.data.success.username &&
      response.data.success.displayedName &&
      response.data.success.id &&
      response.data.success.status &&
      response.data.success.friends &&
      response.data.success.friendRequest &&
      response.data.success.pendingRequest &&
      response.data.success.blocked
    ) {
      this.avatar = response.data.success.avatar ? response.data.success.avatar : this.DEFAULT_AVATAR;
      this.username = response.data.success.username;
      this.displayedName = response.data.success.displayedName;
      this.id = response.data.success.id;
      this.status = response.data.success.status as LypeStatus;
      this.customStatus = response.data.success.customStatus;
      this._friends = response.data.success.friends;
      this._friendRequest = response.data.success.friendRequest;
      this._pendingRequest = response.data.success.pendingRequest;
      this._blocked = response.data.success.blocked;

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

  get blockedUsers() {
    return this._blocked;
  }

  get pendingRequests() {
    return this._pendingRequest;
  }

  get friendRequest() {
    return this._friendRequest;
  }

  get friends() {
    return this._friendRequest;
  }
}

export function getStatusColour(status?: LypeStatus) {
  switch (status) {
    case 'online':
      return '#43b581';
    case 'awayFromKeyboard':
      return '#faa61a';
    case 'doNotDisturb':
      return '#f04747';
    default:
      return '#747f8d';
  }
}
