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
  username: string;
  email: string;
  oldPassword: string;
  newPassword: string;
  repeatPassword: string;
}

export interface IAccountChangeEmailRequest {
  username: string;
  email: string;
  password: string;
  newEmail: string;
}
