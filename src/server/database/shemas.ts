import { Schema, model, Document } from 'mongoose';
import { mongoose } from './database';
import { hashPassword } from './passwordHasher';
import * as Joi from '@hapi/joi';

export interface IAccountRequest {
  name: string;
  password: string;
  passwordRepeat: string;
  mail: string;
}

export interface IMongooseUserSchema extends Document {
  name: string;
  password: string;
  createdAt: number;
  mail: string;
}

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: String,
    createdAt: { type: Number, required: true, unique: true },
    mail: String,
  },
  {
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  },
);

const MongoUser = model<IMongooseUserSchema>('User', UserSchema);
const user = mongoose.model('User', UserSchema);

export function getUserById(): Promise<void> {
  return new Promise((resolve, reject) => {

  });
}

export function createUser(name: string, email: string, password: string): Promise<IMongooseUserSchema> {
  return new Promise(async (resolve, rejects) => {
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
      const schema = new MongoUser({
        name: name,
        password: hashedPassword,
        createdAt: Date.now(),
        mail: email,
      });
      const result = await schema.save();
      resolve(result);
    } catch (error) {
      return rejects(error);
    }
  });
}

export const userAccount = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  repeatPassword: Joi.ref('password'),

  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
}).with('password', 'repeat_password');
