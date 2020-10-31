import { Schema, Document } from "mongoose";
import { mongoose } from "./database";
import { logger } from "./EventLog";

export interface IMongooseTokenBlackList extends Document {
  token: string;
  deleteTime: number;
}

const VerificationSchema = new Schema<IMongooseTokenBlackList>(
  {
    token: { type: String, required: true },
    deleteTime: { type: Number, required: true },
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

const MongoTokenBlackList = mongoose.model<IMongooseTokenBlackList>("blackListTokens", VerificationSchema);

export function isTokenBlackListed(token: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    MongoTokenBlackList.findOne({ token })
      .then(e => resolve(!!e))
      .catch(e => reject(e));
  });
}

export function addTokenToBlackList(token: string, deleteTime: number): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const doesExist = await isTokenBlackListed(token);
      if (doesExist) return resolve();
      const schema = new MongoTokenBlackList({
        token,
        deleteTime,
      });
      schema.save();
      setUpAutoDelete(token, deleteTime);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function setUpAutoDelete(token: string, time: number) {
  setTimeout(() => {
    MongoTokenBlackList.findOne({ token })
      .then(async e => {
        if (e) {
          await e.remove();
        }
      })
      .catch(err => logger.error(err, `Auto delete token ${token} failed`));
  }, time - Date.now());
}

export function rubbishCollectTokens(): Promise<void> {
  return new Promise((resolve, reject) => {
    MongoTokenBlackList.find()
      .then(async data => {
        if (data) {
          for (const collection of data) {
            if (collection.deleteTime < Date.now()) await collection.remove();
            else setUpAutoDelete(collection.token, collection.deleteTime - Date.now());
          }
          resolve();
        }
      })
      .catch(err => {
        logger.error(err, "Problem fetching data from database");
        reject(err);
      });
  });
}
