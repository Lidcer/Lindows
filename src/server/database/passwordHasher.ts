import { hash, genSalt, compare } from 'bcrypt';

const saltRounds = 10;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    genSalt(saltRounds, (err, salt) => {
      if (err) return reject(err);
      hash(password, salt, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  });
}

export function verifyPassword(password: string, hashPassword: string): Promise<boolean> {
  return new Promise(async (resolve, rejects) => {
    try {
      const result = await compare(password, hashPassword);
      resolve(result);
    } catch (error) {
      rejects(error);
    }
  });
}
