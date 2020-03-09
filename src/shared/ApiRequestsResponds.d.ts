export interface IUserDTO {
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

export interface IAccountRegisterRequest {
  username: string;
  email: string;
  password: string;
  repeatPassword: string;
}

export interface IAccountLoginRequest {
  username: string;
  password: string;
  email: string;
}

export interface IAccountChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  repeatNewPassword: string;
}

export interface IAccountChangeEmailRequest {
  password: string;
  email: string;
}

export interface IResponse<T> {
  error?: string;
  details?: any;
  message?: string;
  success?: T;
}

export interface IAccount {
  id: string;
  username: string;
  avatar?: string;
}

export interface IP {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  readme?: string;
  bogon?: boolean;
}

export declare type IAccountResponse = IResponse<IAccount>;
export declare type IIPResponse = IResponse<IP>;