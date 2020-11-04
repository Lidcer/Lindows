import { Schema, Document } from "mongoose";
import { mongoose, sql } from "../../database/database";
import { hashPassword } from "../../database/passwordHasher";
import { join } from "path";
import { Model, DataTypes, Sequelize, Op } from "sequelize";

import * as Jimp from "jimp";
import { DATA_BASE_TYPE } from "../../config";
import { ID, isMongo, isMySql, Modifiable } from "../../database/modifiable";
import { existFile, mkdir, unlink } from "../../FsUtils";

export const imagesPath = ["data", "avatars"];
export const dataImages = join(process.cwd(), "data", "avatars");

export async function setupImages(): Promise<void> {
  const exist = existFile(dataImages);
  if (exist) return;
  await mkdir(dataImages);
}

export declare type UserAccountFlags = "noImageUpload";

//const user
export interface User {
  username: string;
  displayedName: string;
  password: string;
  compromised: boolean;
  banned: boolean;
  accountCreatedAt: number;
  lastOnlineAt: number;
  settings: string;
  avatar: string;
  email: string;
  note: string;
  verified: boolean;
  ip: string[] | string;
  roles: string[] | string;
  flags: UserAccountFlags[] | string;
}

//mongoDB
export interface MongooseUserSchema extends Document, User {}

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    displayedName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    accountCreatedAt: { type: Number, required: true },
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

interface SqlUser extends User, ID {}
class UserMySql extends Model<SqlUser, User> implements User {
  public readonly id: number;
  public /*readonly*/ username: string;
  public displayedName: string;
  public password: string;
  public compromised: boolean;
  public banned: boolean;
  public lastOnlineAt: number;
  public settings: string;
  public avatar: string;
  public email: string;
  public note: string;
  public verified: boolean;
  public ip: string;
  public roles: string;
  public flags: string;
  public accountCreatedAt: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserMySql.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    displayedName: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    compromised: { type: DataTypes.BOOLEAN, allowNull: false },
    banned: { type: DataTypes.BOOLEAN, allowNull: false },
    accountCreatedAt: { type: DataTypes.BIGINT, allowNull: false },
    lastOnlineAt: { type: DataTypes.BIGINT, allowNull: false },
    settings: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    note: { type: DataTypes.STRING, allowNull: false },
    verified: { type: DataTypes.STRING, allowNull: false },
    ip: { type: DataTypes.STRING, allowNull: false },
    roles: { type: DataTypes.STRING, allowNull: false },
    flags: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize: sql, modelName: "user" },
);

type UserDbType = MongooseUserSchema | UserMySql;
const MongoUser = mongoose.model<MongooseUserSchema>("User", UserSchema);
MongoUser.collection.createIndex({ username: "text", displayedName: "text" });

export class UserModifiable extends Modifiable<MongooseUserSchema, UserMySql> implements User {
  get id() {
    if (this.isMongo(this.db)) {
      return this.db._id.toString();
    } else if (this.isMySql) {
      return this.db.id;
    }
  }

  get username(): string {
    return this.db.username;
  }
  set username(username: string) {
    this.db.username = username;
  }
  get displayedName(): string {
    return this.db.displayedName;
  }
  set displayedName(displayedName: string) {
    this.db.displayedName = displayedName;
  }
  get banned(): boolean {
    return this.db.banned;
  }
  set banned(banned: boolean) {
    this.db.banned = banned;
  }
  get avatar(): string {
    return this.db.avatar;
  }
  set avatar(avatar: string) {
    this.db.avatar = avatar;
  }
  get password(): string {
    return this.db.password;
  }
  set password(passwords: string) {
    this.db.password = passwords;
  }
  get compromised(): boolean {
    return this.db.compromised;
  }
  set compromised(compromised: boolean) {
    this.db.compromised = compromised;
  }
  get accountCreatedAt(): number {
    return this.db.accountCreatedAt;
  }
  get lastOnlineAt(): number {
    return this.db.accountCreatedAt;
  }
  set lastOnlineAt(lastOnlineAt: number) {
    this.db.accountCreatedAt = lastOnlineAt;
  }
  get settings(): string {
    return this.db.settings;
  }
  set settings(settings: string) {
    this.db.settings = settings;
  }
  get email(): string {
    return this.db.email;
  }
  set email(email: string) {
    this.db.email = email;
  }
  get note(): string {
    return this.db.note;
  }
  set note(note: string) {
    this.db.note = note;
  }
  get verified(): boolean {
    return this.db.verified;
  }
  set verified(verified: boolean) {
    this.db.verified = verified;
  }

  get ip(): string[] {
    return this.toArray(this.db.ip);
  }
  set ip(ip: string[]) {
    if (this.isMongo(this.db)) {
      this.db.ip = ip;
    } else if (this.isMySql(this.db)) {
      this.db.ip = this.fromArray(ip);
    }
  }

  get roles(): string[] {
    return this.toArray(this.db.roles);
  }
  set roles(roles: string[]) {
    if (this.isMongo(this.db)) {
      this.db.roles = roles;
    } else if (this.isMySql(this.db)) {
      this.db.roles = this.fromArray(roles);
    }
  }

  get flags(): UserAccountFlags[] {
    return this.toArray(this.db.flags) as UserAccountFlags[];
  }

  set flags(flags: UserAccountFlags[]) {
    if (this.isMongo(this.db)) {
      this.db.flags = flags;
    } else if (this.isMySql(this.db)) {
      this.db.flags = this.fromArray(flags);
    }
  }

  async save() {
    await this.db.save();
    return this;
  }
  async remove() {
    if (this.isMongo(this.db)) {
      await this.db.remove();
    } else if (this.isMySql(this.db)) {
      await this.db.destroy();
    }
  }
}

export async function getUserById(id: string) {
  let user: UserDbType | undefined = undefined;
  if (DATA_BASE_TYPE === "mongoDB") {
    user = await MongoUser.findById(id);
  } else if (DATA_BASE_TYPE === "mySql") {
    user = await UserMySql.findByPk(parseInt(id));
  }
  if (!user) return undefined;
  return new UserModifiable(user);
}

export async function doesUserWithDisplayedNamesExist(name: string) {
  const users = await MongoUser.find();
  for (const user of users) {
    if (user.displayedName.toLowerCase() === name.toLowerCase()) return true;
  }
  return false;
}

export async function findUserByName(username: string) {
  let user: UserDbType | undefined = undefined;
  if (DATA_BASE_TYPE === "mongoDB") {
    user = await MongoUser.findOne({ username: username.toLowerCase().replace(/\s/g, "") });
  } else if (DATA_BASE_TYPE === "mySql") {
    user = await UserMySql.findOne({
      where: Sequelize.where(Sequelize.fn("lower", Sequelize.col("username")), Sequelize.fn("lower", username)),
    });
  }
  if (!user) return undefined;
  return new UserModifiable(user);
}

export async function findUserByEmail(email: string) {
  let user: UserDbType | undefined = undefined;
  if (DATA_BASE_TYPE === "mongoDB") {
    user = await MongoUser.findOne({ email });
  } else if (DATA_BASE_TYPE === "mySql") {
    user = await UserMySql.findOne({ where: { email } });
  }
  if (!user) return undefined;
  return new UserModifiable(user);
}

export async function registerUserInDatabase(
  username: string,
  email: string,
  password: string,
  ip: string,
): Promise<UserModifiable> {
  const hashedPassword = await hashPassword(password);
  const user: User = {
    username: username.toLowerCase().replace(/\s/g, ""),
    displayedName: username,
    avatar: "",
    password: hashedPassword,
    accountCreatedAt: Date.now(),
    lastOnlineAt: Date.now(),
    banned: false,
    compromised: false,
    note: "",
    settings: "",
    email,
    flags: isMongo() ? [] : isMySql ? "[]" : undefined,
    roles: isMongo() ? [] : isMySql ? "[]" : undefined,
    verified: false,
    ip: isMongo() ? [ip] : isMySql ? JSON.stringify([ip]) : undefined,
  };
  if (isMongo()) {
    const mongoDBShema = new MongoUser(user);
    await mongoDBShema.save();
    return new UserModifiable(mongoDBShema);
  }

  if (isMySql()) {
    await sql.sync();
    const mySqlUser = await UserMySql.create(user);
    await mySqlUser.save();
    return new UserModifiable(mySqlUser);
  }
  throw new Error("Unknown database type");
}

export async function getUserByAccountOrEmail(username: string, email?: string): Promise<UserModifiable | null> {
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
  user: UserModifiable,
  newPassword: string,
  shouldSave = true,
): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.lastOnlineAt = Date.now();
  if (shouldSave) user.save();
}

export async function changeEmailOnAccount(user: UserModifiable, email: string, shouldSave = true): Promise<void> {
  user.email = email;
  user.lastOnlineAt = Date.now();
  if (shouldSave) user.save();
}

export async function changeAvatar(user: UserModifiable, data: Buffer): Promise<void> {
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

async function removeAvatarIfExist(user: UserModifiable) {
  if (user.avatar) {
    const imagePath = join(dataImages, user.avatar);
    const exist = await existFile(imagePath);
    if (exist) {
      await unlink(imagePath);
      user.avatar = undefined;
      await user.save();
    }
  }
}

export async function findSimilarUser(query: string) {
  query = query.toLowerCase();
  let result: UserDbType[] | undefined = undefined;
  if (isMongo()) {
    // @ts-ignore
    result = await MongoUser.find({ $text: { $search: query, $caseSensitive: false, $diacriticSensitive: true } });
  }
  if (isMySql()) {
    result = await UserMySql.findAll({
      where: {
        username: {
          [Op.like]: `%${query}%`,
        },
      },
    });
  }

  if (!result || !result.length) return undefined;
  return result.map(r => new UserModifiable(r));
}

export function getUserImage(user: UserModifiable): string | null {
  const avatar = user.avatar;
  if (!avatar) return null;

  return `/${imagesPath.join("/")}/${avatar}`;
}

export async function getAllUsers() {
  let result: UserModifiable[] | undefined;
  if (isMongo()) {
    const found = await MongoUser.find();
    if (found) {
      result = found.map(m => new UserModifiable(m));
    }
  } else if (isMySql()) {
    const found = await UserMySql.findAll();
    if (found) {
      result = found.map(m => new UserModifiable(m));
    }
  }
  if (!result) return [];
  return result;
}
