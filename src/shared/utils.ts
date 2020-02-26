import { IUserDTO } from './ApiRequests';

export const getUserFullName = (user: IUserDTO): string => `${user.firstName} ${user.lastName}`;
