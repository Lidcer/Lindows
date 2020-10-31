import { Schema, Document } from "mongoose";
import { mongoose } from "../../database/database";
import { hashPassword } from "../../database/passwordHasher";
import { join } from "path";
import { exists, mkdir, unlink } from "fs";
import * as Jimp from "jimp";
import { StringSchema } from "@hapi/joi";

export const imagesPath = ["data", "avatars"];
export const dataImages = join(process.cwd(), "data", "avatars");

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

export declare type UserAccountFlags = "noImageUpload";
export interface IMongooseUserSchema extends Document {
  username: string;
  displayedName: string;
  password: string;
  compromised: boolean;
  banned: boolean;
  createdAt: number;
  lastOnlineAt: number;
  avatar: string;
  email: string;
  note: string;
  verified: boolean;
  ip: string[];
  roles: string[];
  flags: UserAccountFlags[];
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
    flags: [String],
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

export const MongoUser = mongoose.model<IMongooseUserSchema>("User", UserSchema);
MongoUser.collection.createIndex({ username: "text", displayedName: "text" });

export async function getUserById(id: string): Promise<IMongooseUserSchema> {
  return await MongoUser.findById(id);
}

export async function doesUserWithDisplayedNamesExist(name: string) {
  const users = await MongoUser.find();
  for (const user of users) {
    if (user.displayedName.toLowerCase() === name.toLowerCase()) return true;
  }
  return false;
}

export async function findUserByName(username: string) {
  return await MongoUser.findOne({ username: username.toLowerCase().replace(/\s/g, "") });
}

export async function findUserByEmail(email: string) {
  return await MongoUser.findOne({ email });
}

export async function registerUserInDatabase(
  username: string,
  email: string,
  password: string,
  ip: string,
): Promise<IMongooseUserSchema> {
  const hashedPassword = await hashPassword(password);
  const schema = new MongoUser({
    username: username.toLowerCase().replace(/\s/g, ""),
    displayedName: username,
    password: hashedPassword,
    createdAt: Date.now(),
    lastOnlineAt: Date.now(),
    banned: false,
    compromised: false,
    note: "",
    settings: "",
    email,
    flags: [],
    roles: [],
    verified: false,
    ip: [ip],
  });

  await schema.save();
  return schema;
}

export async function getUserByAccountOrEmail(username: string, email?: string): Promise<IMongooseUserSchema | null> {
  if (!email) email = username;
  const userUserName = await findUserByName(username);
  if (userUserName) {
    return userUserName;
  }
  const userEmail = await findUserByEmail(email);
  if (userEmail) {
    return userEmail;
  }
  return null;
}

export async function changePasswordOnAccount(
  user: IMongooseUserSchema,
  newPassword: string,
  shouldSave = true,
): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.lastOnlineAt = Date.now();
  if (shouldSave) user.save();
}

export async function changeEmailOnAccount(user: IMongooseUserSchema, email: string, shouldSave = true): Promise<void> {
  user.email = email;
  user.lastOnlineAt = Date.now();
  if (shouldSave) user.save();
}

export async function changeAvatar(user: IMongooseUserSchema, data: Buffer): Promise<void> {
  await removeAvatarIfExist(user);
  const clearedName = user.username.replace(/[^a-zA-Z ]/g, "");
  const ImageName = `${clearedName}${Date.now()}.png`;
  const imagePath = join(dataImages, `${ImageName}`);
  await storeImage(data, imagePath);
  user.avatar = ImageName;
  await user.save();
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

export async function findSimilarUser(query: string) {
  query = query.toLowerCase();
  // @ts-ignore
  const result = await MongoUser.find({ $text: { $search: query, $caseSensitive: false, $diacriticSensitive: true } });
  return result;
}

export function getUserImage(user: IMongooseUserSchema): string | null {
  const avatar = user.avatar;
  if (!avatar) return null;

  return `/${imagesPath.join("/")}/${avatar}`;
}
