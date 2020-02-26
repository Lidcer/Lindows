import { IUserDTO } from '../shared/ApiRequests';

export const users: IUserDTO[] = [];

export function getUserById(userId: string): IUserDTO {
  return users.find(u => u.userId === userId);
}
