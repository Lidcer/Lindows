import { IUserDTO } from '../shared/IUserDTO';

export const users: IUserDTO[] = [];

export function getUserById(userId: string): IUserDTO {
  return users.find(u => u.userId === userId);
}
