import { Schema, model, Document } from 'mongoose';
import { mongoose } from './database';
import { hashPassword } from './passwordHasher';
import { join } from 'path';
import { exists, mkdir, writeFile, unlink, readFile } from 'fs';
import * as Jimp from 'jimp';
import { resolve } from 'dns';

export const imagesPath = ['data', 'avatars'];
export const dataImages = join(process.cwd(), 'data', 'avatars');

export function setupImages(): Promise<void> {
  return new Promise((resolve, reject) => {
    exists(dataImages, doesImageFolderExist => {
      if (doesImageFolderExist) {
        resolve();
      } else {
        mkdir(dataImages, err => {
          if (err) return reject(err);
          resolve();
        });
        reject();
      }
    });
  });
}

declare type UserAccountFlags = 'noImageUpload';
export interface IMongooseUserSchema extends Document {
  username: string;
  displayedName: string;
  password: string;
  compromised: boolean;
  banned: boolean;
  createdAt: number;
  lastOnlineAt: number;
  avatar: string;
  settings: string;
  email: string;
  verified: boolean;
  ip: string[];
  roles: string[];
  flags: UserAccountFlags[];
  permissions: string[];
}

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    displayedName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Number, required: true },
    lastOnlineAt: { type: Number, required: true },
    compromised: Boolean,
    banned: Boolean,
    ip: [String],
    note: String,
    avatar: String,
    verified: Boolean,
    roles: [String],
    settings: String,
    permissions: [String],
    flags: [String],
  },
  {
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  },
);

const MongoUser = mongoose.model<IMongooseUserSchema>('User', UserSchema);

export function getUserById(id: string): Promise<IMongooseUserSchema> {
  return new Promise((resolve, reject) => {
    MongoUser.findById(id)
      .then(user => {
        resolve(user);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function doesUserWithDisplayedNamesExist(name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    MongoUser.find()
      .then(users => {
        for (const user of users) {
          if (user.displayedName.toLowerCase() === name.toLowerCase()) return resolve(true);
        }
        resolve(false);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function findUserByName(username: string): Promise<IMongooseUserSchema> {
  return new Promise((resolve, reject) => {
    MongoUser.findOne({ username: username.toLowerCase().replace(/\s/g, '') })
      .then(users => {
        resolve(users);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function findUserByEmail(email: string): Promise<IMongooseUserSchema> {
  return new Promise((resolve, reject) => {
    MongoUser.findOne({ email })
      .then(users => {
        resolve(users);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function registerUserInDatabase(
  username: string,
  email: string,
  password: string,
  ip: string,
): Promise<IMongooseUserSchema> {
  return new Promise(async (resolve, rejects) => {
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
      const schema = new MongoUser({
        username: username.toLowerCase().replace(/\s/g, ''),
        displayedName: username,
        password: hashedPassword,
        createdAt: Date.now(),
        lastOnlineAt: Date.now(),
        banned: false,
        compromised: false,
        note: '',
        settings: '',
        email,
        flags: [],
        roles: [],
        verified: false,
        ip: [ip],
        permissions: [],
      });
      await schema.save();

      resolve(schema);
    } catch (error) {
      return rejects(error);
    }
  });
}

export function getUserByAccountOrEmail(username: string, email?: string): Promise<IMongooseUserSchema | null> {
  return new Promise(async resolve => {
    if (!email) email = username;

    const userUserName = await findUserByName(username);
    if (userUserName) {
      resolve(userUserName);
      return;
    }
    const userEmail = await findUserByEmail(email);
    if (userEmail) {
      resolve(userEmail);
      return;
    }
    return resolve(null);
  });
}

export function changePasswordOnAccount(
  user: IMongooseUserSchema,
  newPassword: string,
  shouldSave = true,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      user.lastOnlineAt = Date.now();
      if (shouldSave) user.save();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function changeEmailOnAccount(user: IMongooseUserSchema, email: string, shouldSave = true): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      user.email = email;
      user.lastOnlineAt = Date.now();
      if (shouldSave) user.save();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function changeAvatar(user: IMongooseUserSchema, data: Buffer): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await removeAvatarIfExist(user);
      const clearedName = user.username.replace(/[^a-zA-Z ]/g, '');
      const ImageName = `${clearedName}${Date.now()}.png`;
      const imagePath = join(dataImages, `${ImageName}`);
      await storeImage(data, imagePath);
      user.avatar = ImageName;
      await user.save();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function storeImage(data: Buffer, path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Jimp.read(data)
      .then(image => {
        image.resize(512, 512);
        image.write(path, err => {
          if (err) return reject(err);
          else resolve();
        });
      })
      .catch(err => reject(err));
  });
}

function removeAvatarIfExist(user: IMongooseUserSchema): Promise<void> {
  return new Promise((resolve, reject) => {
    if (user.avatar) {
      const imagePath = join(dataImages, user.avatar);
      exists(imagePath, doesExist => {
        if (doesExist) {
          unlink(imagePath, err => {
            if (err) return reject(err);
            user.avatar = undefined;
            user
              .save()
              .then(() => {
                resolve();
              })
              .catch(() => {
                reject();
              });
          });
        } else resolve();
      });
    } else resolve();
  });
}

export function getUserImage(user: IMongooseUserSchema): string | null {
  const avatar = user.avatar;
  if (!avatar) return null;

  return `./${imagesPath.join('/')}/${avatar}`;
}
