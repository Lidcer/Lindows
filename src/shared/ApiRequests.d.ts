export interface IUserDTO {
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

export interface IAccountRegisterRequest {
  username: string;
  password: string;
  passwordRepeat: string;
  email: string;
}

export interface IAccountLoginRequest {
  username: string;
  password: string;
  email: string;
}
