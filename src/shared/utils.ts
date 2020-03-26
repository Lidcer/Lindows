import { IUserDTO } from './ApiUsersRequestsResponds';

export const getUserFullName = (user: IUserDTO): string => `${user.firstName} ${user.lastName}`;
