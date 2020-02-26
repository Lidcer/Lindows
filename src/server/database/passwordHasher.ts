import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT } from '../config';
const saltRounds = 10;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) return reject(err);
      bcrypt.hash(password, PASSWORD_SALT, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });
  });
}
