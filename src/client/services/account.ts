import { EventEmitter } from 'events';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TOKEN_HEADER } from '../../shared/constants';
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
} from '../../shared/ApiRequestsResponds';
import { services } from './services';

export interface IAccountInfo {
  accountId: string;
  username: string;
  displayedName: string;
  avatar: string | null;
}

export declare interface IAccount {
  on(event: 'ready', listener: (accountInfo: IAccountInfo | null) => void): this;
  on(event: 'imageReady', listener: (accountInfo: IAccountInfo | null) => void): this;
  on(event: 'login', listener: (accountInfo: IAccountInfo) => void): this;
  on(event: 'logout', listener: () => void): this;
}

export class IAccount extends EventEmitter {
  private DEFAULT_AVATAR = './assets/images/DefaultAvatar.svg';
  private _token = '';
  private accountId: string;
  private username: string;
  private displayedName: string;

  private imageMap = new Map<string, string>();
  private avatar: string = null;
  private readonly serviceName = 'accountManager';

  constructor() {
    super();
    this._token = this.token;

    this.checkAccount()
      .catch(_ => {
        /* ignored */
      })
      .finally(() => {
        this.emit('ready', this.account);
      });

    services.broadcaster.on(`${this.serviceName}-login`, this.loginFromOtherSources);
    services.broadcaster.on(`${this.serviceName}-logout`, this.logoutFromOtherSource);
  }

  private loginFromOtherSources = (account: IAccountInfo) => {
    this.username = account.username;
    this.displayedName = account.displayedName;
    this.accountId = account.accountId;
    this.avatar = account.avatar;
    this.token;
    this.fetchImage();
    this.emit('login', this.account);
  };

  private logoutFromOtherSource = () => {
    this.username = undefined;
    this.displayedName = undefined;
    this.accountId = undefined;
    this.avatar = this.DEFAULT_AVATAR;
    this.emit('logout');
  };

  public register(username: string, email: string, password: string, repeatPassword: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!username) return reject(new Error('Username is required'));
      if (!email) return reject(new Error('Email is required'));
      if (!password) return reject(new Error('Password has not been provided'));
      if (!repeatPassword) return reject(new Error('Missing repeated password'));
      if (password !== repeatPassword) return reject(new Error('Passwords does not match'));

      const accountRegisterRequest: IAccountRegisterRequest = { email, password, repeatPassword, username };

      Axios.post<IResponse<string>>('/api/v1/users/register', accountRegisterRequest)
        .then(response => {
          resolve(response.data.message);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  login(usernameOrEmail: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!usernameOrEmail) return reject(new Error('Username or email has not been provided'));
      if (!password) return reject(new Error('Password has not been provided'));

      const accountLoginRequest: IAccountLoginRequest = { usernameOrEmail, password };
      Axios.post<IAccountResponse>('/api/v1/users/login', accountLoginRequest)
        .then(async response => {
          const token = response.headers[TOKEN_HEADER];
          const ok = this.disassembleResponse(response, token);
          if (!ok) return reject(new Error('Invalid data received from server'));
          else await this.fetchImage();
          resolve(response.data.message);
        })
        .catch((error: any) => {
          reject(this.disassembleError(error));
        });
    });
  }

  private checkAccount(): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!this.token) return reject(new Error('Missing token'));

      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
      Axios.get<IAccountResponse>('/api/v1/users/check-account', axiosRequestConfig)
        .then(async response => {
          const ok = this.disassembleResponse(response);
          if (!ok) return reject(new Error('Invalid data received from server'));
          else this.fetchImage();
          resolve(this.account);
        })
        .catch(err => {
          if (err && err.response && err.response.status && err.response.status === 401) {
            this.logout();
          }
          reject(err);
        });
    });
  }

  async changeAvatar(password: string, file: File, callback: (progress: number) => void): Promise<IAccountInfo> {
    return new Promise(async (resolve, reject) => {
      if (!this._token) return reject('User not loggined in');
      if (!password) return reject('Password has not been provided');
      if (!file) return reject('Picture has not been provided');

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
          : pe.target.getResponseHeader('content-length') ||
            pe.target.getResponseHeader('x-decompressed-content-length');
        if (totalLength !== null) callback(Math.round((pe.loaded * 100) / totalLength));
      };
      await Axios.post<IAccountResponse>('/api/v1/users/change-avatar', formData, axiosRequestConfig)
        .then(response => {
          const ok = this.disassembleResponse(response);
          if (!ok) return reject(new Error('Invalid data received from server'));
          else this.fetchImage();
          resolve(this.account);
          resolve(this.account);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  checkOutTemporarilyToken(token: string): Promise<VerificationType> {
    return new Promise(async (resolve, reject) => {
      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      axiosRequestConfig.headers[TOKEN_HEADER] = token;
      await Axios.get<IResponse<VerificationType>>(`/api/v1/users/check-token`, axiosRequestConfig)
        .then(response => {
          const body = response.data;
          if (body.success && body.success) {
            resolve(body.success as VerificationType);
          } else {
            reject(new Error('Invalid data received from server'));
          }
        })
        .catch(error => {
          console.log(error);
          reject(this.disassembleError(error));
        });
    });
  }

  changePasswordWithTemporarilyToken(token: string, password: string, repeatPassword: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!password) return reject(new Error('Password has not been provided'));
      if (!repeatPassword) return reject(new Error('Missing repeated password'));
      if (password !== repeatPassword) return reject(new Error('Password do not match'));
      const request: IAccountVerificationPassword = {
        password,
        repeatPassword,
      };
      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      axiosRequestConfig.headers[TOKEN_HEADER] = token;

      await Axios.post<IResponse<string>>(`/api/v1/users/alter/`, request, axiosRequestConfig)
        .then(response => {
          const body = response.data;
          if (body.success && body.message) resolve(body.message);
          else reject(new Error('Invalid data received from server'));
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  verifyEmail(token: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const axiosRequestConfig: AxiosRequestConfig = {
        headers: {},
      };
      axiosRequestConfig.headers[TOKEN_HEADER] = token;
      await Axios.post<IAccountResponse>(`/api/v1/users/alter`, undefined, axiosRequestConfig)
        .then(response => {
          resolve(response.data.message);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  resetPassword(email: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!email) return reject('Missing email');
      if (!email.includes('@')) return reject('Not valid mail');
      const accountVerificationEmail: IAccountVerificationEmail = { email };

      Axios.post<IResponse<string>>('/api/v1/users/reset-password', accountVerificationEmail)
        .then(response => {
          if (response && response.data && response.data.message) resolve(response.data.message);
          else reject(this.disassembleError('Invalid data received from server'));
        })
        .catch(err => {
          reject(this.disassembleError(err));
        });
    });
  }

  changePassword(oldPassword: string, newPassword: string, repeatNewPassword: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!this._token) return reject(new Error('User not loggined in'));
      if (!oldPassword) return reject(new Error('old Password has not been provided'));
      if (!newPassword) return reject(new Error('Password has not been provided'));
      if (!repeatNewPassword) return reject(new Error('Repeat password has not been provided'));
      if (newPassword !== repeatNewPassword) return reject(new Error('Passwords do not match'));

      const iAccountChangeAccount: IAccountChangePasswordRequest = {
        repeatNewPassword,
        newPassword,
        oldPassword,
      };

      Axios.post<IAccountResponse>('/api/v1/users/change-password', iAccountChangeAccount)
        .then(response => {
          const ok = this.disassembleResponse(response);
          if (!ok) return reject(new Error('Invalid data received from server'));
          else this.fetchImage();
          resolve(this.account);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  public changeDisplayName(displayedName: string, password: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!displayedName) return reject(new Error('new name has not been provided'));
      if (!password) return reject(new Error('Password has not been provided'));

      const accountRegisterRequest: IAccountDisplayedNameRequest = {
        displayedName,
        password,
      };

      Axios.post<IAccountResponse>('/api/v1/users/change-displayed-name', accountRegisterRequest)
        .then(response => {
          const ok = this.disassembleResponse(response);
          if (!ok) return reject(new Error('Invalid data received from server'));
          else this.fetchImage();
          resolve(this.account);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  changeEmail(password: string, newEmail: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!this._token) return reject('User not loggined in');
      if (!password) return reject('Password has not been provided');
      if (!newEmail) return reject('New email has not been provided');

      const iAccountChangeEmailAccount: IAccountChangeEmailRequest = {
        password,
        newEmail,
      };

      Axios.post<IAccountResponse>('/api/v1/users/changeEmail', iAccountChangeEmailAccount)
        .then(response => {
          const ok = this.disassembleResponse(response);
          if (!ok) return reject(new Error('Invalid data received from server'));
          else this.fetchImage();
          resolve(this.account);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  _deleteAccount(password: string, repeatPassword: string, reason: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._token) return reject('User not loggined in');
      if (!password) return reject('Password has not been provided');
      if (!reason) return reject('reason has not been provided');
      if (password !== repeatPassword) return reject('Password do not match');

      const deleteAccountRequest: IAccountDeleteAccountRequest = {
        password,
        reason,
        repeatPassword,
      };
      const config: AxiosRequestConfig = {
        data: deleteAccountRequest,
      };
      Axios.delete<IResponse<string>>('/api/v1/users/delete-account', config)
        .then(response => {
          if (response.data.error) reject(new Error(response.data.error));
          else resolve(response.data.message);
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  private get token() {
    this._token = localStorage.getItem('auth');
    return this._token;
  }

  private setToken(token: string) {
    this._token = token;
    localStorage.setItem('auth', token);
    return this;
  }

  loginWithToken(token?: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!token) token = this._token;
      else this._token = token;
      if (!token) return reject(new Error('Token not provided'));
      this.checkAccount()
        .then(acInfo => {
          resolve(acInfo);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  private fetchUserImage(imageUrl: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      console.log(imageUrl);
      const image = this.imageMap.get(imageUrl);
      if (image) return resolve(image);

      Axios.get(imageUrl, {
        responseType: 'arraybuffer',
      })
        .then(response => {
          const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
          resolve(imageBase64);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  fetchImage() {
    if (this.avatar !== this.DEFAULT_AVATAR) {
      this.fetchUserImage(this.avatar).catch(err => {
        console.error(err);
      });
    }
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
        services.broadcaster.emit(`${this.serviceName}-login`, this.account);
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
    services.broadcaster.emit(`${this.serviceName}-logout`);
  }

  private disassembleError(error: any) {
    if (error && error.response && error.response.data && error.response.data.error) {
      return new Error(error.response.data.error);
    } else {
      return new Error('Internal server error');
    }
  }

  public get account(): IAccountInfo {
    if (!this.username) return null;
    return {
      accountId: this.accountId,
      displayedName: this.displayedName,
      username: this.username,
      avatar: this.avatar || this.DEFAULT_AVATAR,
    };
  }
  public destroy() {
    services.broadcaster.removeListener(`${this.serviceName}-login`, this.loginFromOtherSources);
    services.broadcaster.removeListener(`${this.serviceName}-logout`, this.logout);
  }
}
