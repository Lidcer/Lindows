import { IUserDTO } from './ApiRequestsResponds';

export const getUserFullName = (user: IUserDTO): string => `${user.firstName} ${user.lastName}`;
