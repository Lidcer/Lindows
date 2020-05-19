import { IAccount, IResponse } from './ApiUsersRequestsResponds';

export interface ILypeAccount extends IAccount {
  status: LypeStatus;
  customStatus: string;
}

export interface IClientAccount extends ILypeAccount {
  friends: ILypeAccount[];
  friendRequest: ILypeAccount[];
  pendingRequest: ILypeAccount[];
  blocked: ILypeAccount[];
}

export interface ILypeFriendsQueryResults {
  users: ILypeAccount[];
}
export interface ILypeUserID {
  userID: string;
}

export interface ILypeSearchQuery {
  query: string;
}
export type LypeStatus = 'online' | 'doNotDisturb' | 'awayFromKeyboard' | 'offline';
export declare type ILypeAccountsResponse = IResponse<ILypeAccount[]>;
export declare type ILypeAccountResponse = IResponse<ILypeAccount>;
export declare type ILypeClientAccountResponse = IResponse<IClientAccount>;
export declare type ILypeFriendsQueryResponse = IResponse<ILypeFriendsQueryResults>;
export declare type ILypeFriendsUserResponse = IResponse<IClientAccount>;
