import { Mongoose, ConnectionOptions } from 'mongoose';
import { DATABASE_CONNECTION_STRING } from '../config';
import { join } from 'path';
import { exists, mkdir } from 'fs';
import { setupImages } from '../routes/users/users-database';

const data = join(process.cwd(), 'data');

const options: ConnectionOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: true,
  useCreateIndex: true,
};

export const mongoose = new Mongoose();

export function setupDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(DATABASE_CONNECTION_STRING, options)
      .then(() => {
        exists(data, async doesExist => {
          if (doesExist) {
            await setupImages();
            resolve();
          } else {
            mkdir(data, async err => {
              if (err) return reject(err);
              await setupImages();
              resolve();
            });
          }
        });
      })
      .catch(err => {
        reject(err);
      });
  });
}
