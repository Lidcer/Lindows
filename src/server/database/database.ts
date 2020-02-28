import { Mongoose, ConnectionOptions } from 'mongoose';
import { DATABASE_CONNECTION_STRING } from '../config';

const options: ConnectionOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: true,
  useCreateIndex: true,
};

export const mongoose = new Mongoose();

export function connectToDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(DATABASE_CONNECTION_STRING, options)
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

connectToDB();
