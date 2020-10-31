//TODO: move joi here
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
  usernameOrEmail: string;
  password: string;
}

export interface IAccountChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  repeatNewPassword: string;
}

export interface IAccountResetPasswordRequest {
  password: string;
  repeatPassword: string;
}

export interface IAccountChangeEmailRequest {
  password: string;
  newEmail: string;
}

export interface IAccountDeleteAccountRequest {
  password: string;
  repeatPassword: string;
  reason: string;
}

export interface IAccountVerificationRequest {
  password: string;
}

export interface IAccountEmailRequest {
  email: string;
}

export interface IAccountDisplayedNameRequest {
  password: string;
  displayedName: string;
}

export interface IAccountVerificationPassword {
  password: string;
  repeatPassword: string;
}

export interface IAccountVerificationEmail {
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
  displayedName: string;
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

export enum VerificationType {
  Verificaiton = 1,
  ChangeEmail,
  PasswordReset,
}

export declare type IAccountResponse = IResponse<IAccount>;
export declare type IIPResponse = IResponse<IP>;
