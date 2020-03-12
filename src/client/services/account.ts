import { EventEmitter } from 'events';
import Axios, { AxiosRequestConfig } from 'axios';
import { TOKEN_HEADER } from '../../shared/constants';
import {
  IAccountLoginRequest,
  IAccountResponse,
  IAccountRegisterRequest,
  IAccountChangePasswordRequest,
  IAccountChangeEmailRequest,
  IAccountResetPasswordRequest,
  IResponse,
} from '../../shared/ApiRequestsResponds';

export interface IAccountInfo {
  accountId: string;
  username: string;
  displayedName: string;
  email: string;
  avatar: string | null;
}

export declare interface IAccount {
  on(event: 'ready', listener: (accountInfo: IAccountInfo | null) => void): this;
  on(event: 'imageReady', listener: (accountInfo: IAccountInfo | null) => void): this;
  on(event: 'login', listener: (accountInfo: IAccountInfo) => void): this;
  on(event: 'logout', listener: () => void): this;
}

export class IAccount extends EventEmitter {
  private DEFAULT_IMAGE = './assets/images/DefaultAvatar.svg';
  private _token = '';
  private accountId: string;
  private username: string;
  private displayedName: string;
  private email: string;
  private imageMap = new Map<string, string>();
  private avatar: string = null;

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

      Axios.get<IAccountResponse>('/api/v1/users/check-account', axiosRequestConfig)
        .then(async response => {
          if (
            response &&
            response.data &&
            response.data.success.username &&
            response.data.success.displayedName &&
            response.data.success.id
          ) {
            this.avatar = response.data.success.avatar;
            this.username = response.data.success.username;
            this.displayedName = response.data.success.displayedName;
            this.accountId = response.data.success.id;
          }

          console.log(response.data);
          if (this.avatar) {
            const image = this.fetchUserImage(this.avatar).catch(err => {
              console.error(err);
            });
            console.log(image);
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

  resetPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!email) return reject('Missing email');
      if (!email.includes('@')) return reject('Not valid mail');

      const accountResetPasswordRequest: IAccountResetPasswordRequest = {
        email,
      };

      Axios.post('/api/v1/users/reset-password', accountResetPasswordRequest)
        .then(response => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
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

  login(usernameOrEmail: string, password: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!usernameOrEmail) return reject(new Error('Username or email has not been provided'));
      if (!password) return reject(new Error('Password has not been provided'));

      const accountLoginRequest: IAccountLoginRequest = {
        email: usernameOrEmail,
        password: password,
        username: usernameOrEmail,
      };

      Axios.post<IAccountResponse>('/api/v1/users/login', accountLoginRequest)
        .then(response => {
          const token = response.headers[TOKEN_HEADER];
          const body: IAccountResponse = response.data;
          if (token && body.success && body.success.username && body.success.id && body.success.displayedName) {
            const ac = this.loginIn(token, body.success.username, body.success.id, body.success.displayedName);
            this.setToken(token);
            resolve(ac);
          } else {
            reject(new Error('Fetched data is not correct'));
          }
        })
        .catch((error: any) => {
          reject(this.disassembleError(error));
        });
    });
  }

  public register(username: string, email: string, password: string, repeatPassword: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!username) return reject(new Error('Username is required'));
      if (!email) return reject(new Error('email is required'));
      if (!password) return reject(new Error('Password has not been provided'));
      if (!repeatPassword) return reject(new Error('Missing repeated password'));
      if (password !== repeatPassword) return reject(new Error('Passwords does not match'));

      const accountRegisterRequest: IAccountRegisterRequest = {
        email,
        password,
        repeatPassword,
        username,
      };

      Axios.post('/api/v1/users/register', accountRegisterRequest)
        .then(response => {
          const body: IResponse<string> = response.data;
          resolve(body.success);
        })
        .catch(error => {
          console.error(error);
          if (error && error.response && error.response.data && error.response.data.error) {
            reject(new Error(error.response.data.error));
          } else {
            reject(new Error('Internal server error'));
          }
        });
    });
  }

  changeAvatar(password: string, file: File, callback: (progress: number) => void): Promise<IAccountInfo> {
    return new Promise(async (resolve, reject) => {
      if (!this._token) return reject('User not loggined in');
      if (!password) return reject('Password has not been provided');
      if (!file) return reject('Picture has not been provided');

      //FIXME: add password confirmation

      const formData = new FormData();
      formData.append('file', file);

      console.log(formData);

      try {
        const axiosRequestConfig: AxiosRequestConfig = {
          headers: {},
        };
        axiosRequestConfig.headers[TOKEN_HEADER] = this.token;
        axiosRequestConfig.headers['Content-Type'] = 'multipart-form-data';
        axiosRequestConfig.onUploadProgress = (processEvent: any) => {
          console.log(processEvent); //FIXME: do something about
          callback(processEvent);
        };
        await Axios.post<IAccountResponse>('/api/v1/users/change-avatar', formData, axiosRequestConfig).then(
          response => {
            const body = response.data;
            if (body.success && body.success.username && body.success.id) {
              this.avatar = body.success.avatar;
              resolve(this.account);
            } else {
              reject(new Error('Invalid data received from server'));
            }
          },
        );
      } catch (error) {
        reject(this.disassembleError(error));
      }
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
          const body: IAccountResponse = response.data;
          if (body.success && body.success.username && body.success.id) {
            resolve(this.account);
          } else {
            reject(new Error('Invalid data received from server'));
          }
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  changeEmail(password: string, email: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      if (!this._token) return reject('User not loggined in');
      if (!password) return reject('Password has not been provided');
      if (!email) return reject('New email has not been provided');

      const iAccountChangeEmailAccount: IAccountChangeEmailRequest = {
        email,
        password,
      };

      Axios.post<IAccountResponse>('/api/v1/users/changeEmail', iAccountChangeEmailAccount)
        .then(response => {
          const body = response.data;
          if (body.success && body.success.username && body.success.id) {
            resolve(this.account);
          } else {
            reject(new Error('Invalid data received from server'));
          }
        })
        .catch(error => {
          reject(this.disassembleError(error));
        });
    });
  }

  verifyAccount(code: string): Promise<IAccountInfo> {
    return new Promise((resolve, reject) => {
      Axios.post<IAccountResponse>(`/api/v1/users/verify/${code}`)
        .then(response => {
          const token = response.headers[TOKEN_HEADER];
          const body = response.data;
          console.log(body, token);
          if (token && body.success && body.success.username && body.success.id && body.success.displayedName) {
            const ac = this.loginIn(token, body.success.username, body.success.id, body.success.displayedName);
            resolve(ac);
          } else {
            reject(new Error('Invalid data received from server'));
          }
        })
        .catch(error => {
          reject(this.disassembleError(error));
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

  private loginIn(token: string, username: string, id: string, displayedName: string) {
    this.setToken(token);
    this.username = username;
    this.accountId = id;
    this.displayedName = displayedName;
    this.emit('login', this.account);
    return this.account;
  }

  public logout() {
    this.username = undefined;
    this.accountId = undefined;
    this.email = undefined;
    this.avatar = undefined;
    localStorage.removeItem('auth');
    this.emit('logout');
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
      email: this.email,
      avatar: this.avatar || this.DEFAULT_IMAGE,
    };
  }
}
