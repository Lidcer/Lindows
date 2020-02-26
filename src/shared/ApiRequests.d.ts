export interface IUserDTO {
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

export interface IAccountRequest {
  username: string;
  password: string;
  passwordRepeat: string;
  email: string;
}
