import { IUserDTO } from './ApiUsersRequestsResponds';

export const getUserFullName = (user: IUserDTO): string => `${user.firstName} ${user.lastName}`;


export function cloneDeep<A>(object:A) {
    return JSON.parse(JSON.stringify(object)) as A;
}

export function randomString(length:number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }