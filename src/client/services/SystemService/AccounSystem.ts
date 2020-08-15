import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TOKEN_HEADER } from '../../../shared/constants';
import {
  IAccountLoginRequest,
  IAccountResponse,
  IAccountRegisterRequest,
  IAccountChangePasswordRequest,
  IAccountChangeEmailRequest,
  IResponse,
  IAccountDisplayedNameRequest,
  IAccountVerificationPassword,
  IAccountVerificationEmail,
  IAccountDeleteAccountRequest,
  VerificationType,
} from '../../../shared/ApiUsersRequestsResponds';
import { disassembleError } from '../../essential/requests';
import { fetchImage } from '../../essential/requests';
import { BaseSystemService } from './BaseSystemService';
import { EventEmitter } from 'events';
import { Broadcaster } from './BroadcasterSystem';
import { Network } from './NetworkSystem';
import { inIframe } from '../../utils/util';

export interface IAccountInfo {
  accountId: string;
  username: string;
  displayedName: string;
  avatar: string | null;
}

export class Account extends BaseSystemService {
  private readonly SERVICE_NAME = '__accountManager__';
  private readonly DEFAULT_AVATAR = '/assets/images/DefaultAvatar.svg';
  private _token = '';
  private accountId: string;
  private username: string;
  private displayedName: string;
  private isReady = false;
  private eventEmitter = new EventEmitter();

  private imageMap = new Map<string, string>();
  private avatar: string = null;

  constructor(private broadcaster: Broadcaster, private network: Network) {
    super();
    this._token = this.token;
  }

  start = async () => {
    try {
      await this.checkAccount();
      this.network.authenticate(this.token);
    } catch (error) {
      /* ignored */
    }
    this.broadcaster.on(`${this.SERVICE_NAME}-login`, this.loginFromOtherSources);
    this.broadcaster.on(`${this.SERVICE_NAME}-logout`, this.logoutFromOtherSource);
  };

  on(event: 'imageReady', listener: (accountInfo: IAccountInfo | null) => void): void;
  on(event: 'login', listener: (accountInfo: IAccountInfo) => void): void;
  on(event: 'logout', listener: () => void): void;
  on(event: string | symbol, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  private emit(event: 'imageReady', accountInfo: IAccountInfo | null): void;
  private emit(event: 'login', accountInfo: IAccountInfo): void;
  private emit(event: 'logout'): void;
  private emit(event: string | symbol, ...args: any[]): void {
    this.eventEmitter.emit.apply(this.eventEmitter, [event, ...args]);
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void){
    this.eventEmitter.removeListener(event, listener);
  }

  private loginFromOtherSources = (account: IAccountInfo) => {
    this.username = account.username;
    this.displayedName = account.displayedName;
    this.accountId = account.accountId;
    this.avatar = account.avatar;
    this.fetchImage();
    this.emit('logout');
    this.network.authenticate(this.token);
  };

  private logoutFromOtherSource = () => {
    this.username = undefined;
    this.displayedName = undefined;
    this.accountId = undefined;
    this.emit('login', this.account);
    this.network.unauthenticate();
    this.avatar = this.DEFAULT_AVATAR;
  };

  public async register(username: string, email: string, password: string, repeatPassword: string) {
    if (!username) throw new Error('Username is required');
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password has not been provided');
    if (!repeatPassword) throw new Error('Missing repeated password');
    if (password !== repeatPassword) throw new Error('Passwords does not match');

    const accountRegisterRequest: IAccountRegisterRequest = { email, password, repeatPassword, username };

    try {
      const response = await Axios.post<IResponse<string>>('/api/v1/users/register', accountRegisterRequest);
      return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async login(usernameOrEmail: string, password: string) {
    if (!usernameOrEmail) throw new Error('Username or email has not been provided');
    if (!password) throw new Error('Password has not been provided');

    const accountLoginRequest: IAccountLoginRequest = { usernameOrEmail, password };
    try {
      const response = await Axios.post<IAccountResponse>('/api/v1/users/login', accountLoginRequest);
      const token = response.headers[TOKEN_HEADER];
      const ok = this.disassembleResponse(response, token);
      if (!ok) throw new Error('Invalid data received from server');
      else await this.fetchImage();
      return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  private async checkAccount(): Promise<IAccountInfo> {
    if (!this.token) throw new Error('Missing token');

    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
    try {
      const response = await Axios.get<IAccountResponse>('/api/v1/users/check-account', axiosRequestConfig);

      const ok = this.disassembleResponse(response);
      if (!ok) throw new Error('Invalid data received from server');
      else this.fetchImage();
      return this.account;
    } catch (error) {
      if (error && error.response && error.response.status) {
        switch (error.response.status) {
          case 400:
          case 401:
            this.logout();
          default:
            throw disassembleError(error);
        }
      }
      throw disassembleError(error);
    }
  }

  async changeAvatar(password: string, file: File, callback: (progress: number) => void) {
    if (!this._token) throw new Error('User not loggined in');
    if (!password) throw new Error('Password has not been provided');
    if (!file) throw new Error('Picture has not been provided');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
    axiosRequestConfig.headers['Content-Type'] = 'multipart-form-data';
    axiosRequestConfig.onUploadProgress = pe => {
      const totalLength = pe.lengthComputable
        ? pe.total
        : pe.target.getResponseHeader('content-length') || pe.target.getResponseHeader('x-decompressed-content-length');
      if (totalLength !== null) callback(Math.round((pe.loaded * 100) / totalLength));
    };
    try {
      const response = await Axios.put<IAccountResponse>('/api/v1/users/change-avatar', formData, axiosRequestConfig);
      const ok = this.disassembleResponse(response);
      if (!ok) throw new Error('Invalid data received from server');
      else this.fetchImage();
      return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async checkOutTemporarilyToken(token: string) {
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    try {
      const response = await Axios.get<IResponse<VerificationType>>(`/api/v1/users/check-token`, axiosRequestConfig);
      const body = response.data;
      if (body.success && body.success) {
        return body.success as VerificationType;
      } else {
        throw new Error('Invalid data received from server');
      }
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async changePasswordWithTemporarilyToken(token: string, password: string, repeatPassword: string) {
    if (!password) throw new Error('Password has not been provided');
    if (!repeatPassword) throw new Error('Missing repeated password');
    if (password !== repeatPassword) throw new Error('Password do not match');
    const request: IAccountVerificationPassword = {
      password,
      repeatPassword,
    };
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.put<IResponse<string>>(`/api/v1/users/token-alter/`, request, axiosRequestConfig);
      const body = response.data;
      if (body.success && body.message) return body.message;
      else throw new Error('Invalid data received from server');
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async verifyEmail(token: string) {
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    try {
      const response = await Axios.put<IAccountResponse>(`/api/v1/users/token-alter`, undefined, axiosRequestConfig);
      return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async resetPassword(email: string) {
    if (!email) throw new Error('Missing email');
    if (!email.includes('@')) throw new Error('Not valid mail');
    const accountVerificationEmail: IAccountVerificationEmail = { email };

    try {
      const response = await Axios.put<IResponse<string>>('/api/v1/users/reset-password', accountVerificationEmail);
      if (response && response.data && response.data.message) return response.data.message;
      else throw disassembleError('Invalid data received from server');
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async changePassword(oldPassword: string, newPassword: string, repeatNewPassword: string) {
    if (!this._token) throw new Error('User not loggined in');
    if (!oldPassword) throw new Error('old Password has not been provided');
    if (!newPassword) throw new Error('Password has not been provided');
    if (!repeatNewPassword) throw new Error('Repeat password has not been provided');
    if (newPassword !== repeatNewPassword) throw new Error('Passwords do not match');

    const iAccountChangeAccount: IAccountChangePasswordRequest = {
      repeatNewPassword,
      newPassword,
      oldPassword,
    };
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
    try {
      const response = await Axios.put<IAccountResponse>(
        '/api/v1/users/change-password',
        iAccountChangeAccount,
        axiosRequestConfig,
      );
      const ok = this.disassembleResponse(response);
      if (!ok) throw new Error('Invalid data received from server');
      else this.fetchImage();
      return this.account;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  public async changeDisplayName(displayedName: string, password: string) {
    if (!displayedName) throw new Error('new name has not been provided');
    if (!password) throw new Error('Password has not been provided');

    const accountRegisterRequest: IAccountDisplayedNameRequest = {
      displayedName,
      password,
    };
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
    try {
      const response = await Axios.put<IAccountResponse>(
        '/api/v1/users/change-displayed-name',
        accountRegisterRequest,
        axiosRequestConfig,
      );
      const ok = this.disassembleResponse(response);
      if (!ok) throw new Error('Invalid data received from server');
      else this.fetchImage();
      return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async changeEmail(password: string, newEmail: string) {
    if (!this._token) throw new Error('User not loggined in');
    if (!password) throw new Error('Password has not been provided');
    if (!newEmail) throw new Error('New email has not been provided');

    const iAccountChangeEmailAccount: IAccountChangeEmailRequest = {
      password,
      newEmail,
    };
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
    try {
      const response = await Axios.put<IAccountResponse>(
        '/api/v1/users/change-email',
        iAccountChangeEmailAccount,
        axiosRequestConfig,
      );

      const ok = this.disassembleResponse(response);
      if (!ok) throw new Error('Invalid data received from server');
      else this.fetchImage();
      return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  async _deleteAccount(password: string, repeatPassword: string, reason: string) {
    if (!this._token) throw new Error('User not loggined in');
    if (!password) throw new Error('Password has not been provided');
    if (!reason) throw new Error('reason has not been provided');
    if (password !== repeatPassword) throw new Error('Password do not match');

    const deleteAccountRequest: IAccountDeleteAccountRequest = {
      password,
      reason,
      repeatPassword,
    };
    const config: AxiosRequestConfig = {
      data: deleteAccountRequest,
    };
    try {
      const response = await Axios.delete<IResponse<string>>('/api/v1/users/delete-account', config);
      if (response.data.error) throw new Error(response.data.error);
      else return response.data.message;
    } catch (error) {
      throw disassembleError(error);
    }
  }

  get token() {
    if(!inIframe()) { //TODO replace with storage
      this._token = localStorage.getItem('auth');
    }
    return this._token;
  }

  private setToken(token: string) {
    this._token = token;
    localStorage.setItem('auth', token);
    return this;
  }

  async loginWithToken(token?: string) {
    if (!token) token = this._token;
    else this._token = token;
    if (!token) throw new Error('Token not provided');
    return await this.checkAccount();
  }

  private disassembleResponse(response: AxiosResponse<IAccountResponse>, token?: string): boolean {
    if (
      response &&
      response.data &&
      response.data.success.username &&
      response.data.success.displayedName &&
      response.data.success.id
    ) {
      this.avatar = response.data.success.avatar ? response.data.success.avatar : this.DEFAULT_AVATAR;
      this.username = response.data.success.username;
      this.displayedName = response.data.success.displayedName;
      this.accountId = response.data.success.id;
      if (token && typeof token === 'string') {
        this.setToken(token);
        this.emit('login', this.account);
        this.network.authenticate(token);
        this.broadcaster.emit(`${this.SERVICE_NAME}-login`, this.account);
      }
    } else return false;
    return true;
  }

  public logout() {
    this.username = undefined;
    this.accountId = undefined;
    this.avatar = undefined;
    localStorage.removeItem('auth');
    this.emit('logout');
    this.broadcaster.emit(`${this.SERVICE_NAME}-logout`);
  }

  private fetchImage() {
    if (this.avatar !== this.DEFAULT_AVATAR) {
      fetchImage(this.avatar).catch(err => {
        console.error(err);
      });
    }
  }

  public get account(): IAccountInfo | null {
    if (!this.username) return null;
    const accountInfo = {
      accountId: this.accountId,
      displayedName: this.displayedName,
      username: this.username,
      avatar: this.avatar || this.DEFAULT_AVATAR,
    };
    Object.freeze(accountInfo);
    return accountInfo;
  }
  public destroy() {
    this.broadcaster.removeListener(`${this.SERVICE_NAME}-login`, this.loginFromOtherSources);
    this.broadcaster.removeListener(`${this.SERVICE_NAME}-logout`, this.logout);
  }

  get ready() {
    return this.isReady;
  }
}
