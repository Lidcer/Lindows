import { IAccount, IResponse } from './ApiUsersRequestsResponds';

export interface ILypeAccount extends IAccount {
  status: string;
  customStatus: string;
}

export declare type ILypeAccountResponse = IResponse<ILypeAccount>;
