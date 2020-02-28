import { Schema, model, Document } from 'mongoose';
import { mongoose } from './database';
import { hashPassword } from './passwordHasher';
import * as Joi from '@hapi/joi';
import { resolve } from 'dns';
import { rejects } from 'assert';

export interface IMongooseUserSchema extends Document {
  username: string;
  password: string;
  createdAt: number;
  lastOnlineAt: number;
  profilePix: string;
  settings: string;
  email: string;
  admin: boolean;
  verified: boolean;
  ip: string[];
  flags: string[];
  permissions: string[];
}

interface IAccountResponse {
  _id: string;
  permissions: string[];
}

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Number, required: true },
    lastOnlineAt: { type: Number, required: true },
    ip: [String],
    note: String,
    profilePix: String,
    admin: Boolean,
    verified: Boolean,
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

export function findUserByName(username: string): Promise<IMongooseUserSchema> {
  return new Promise((resolve, reject) => {
    MongoUser.findOne({ username })
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
): Promise<IAccountResponse> {
  return new Promise(async (resolve, rejects) => {
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
      const schema = new MongoUser({
        username: username,
        password: hashedPassword,
        createdAt: Date.now(),
        lastOnlineAt: Date.now(),
        note: '',
        settings: '',
        email,
        flags: [],
        admin: false,
        verified: false,
        ip: [ip],
        permissions: [],
      });
      const result = await schema.save();

      const response: IAccountResponse = {
        _id: result._id,
        permissions: [],
      };

      resolve(response);
    } catch (error) {
      return rejects(error);
    }
  });
}
