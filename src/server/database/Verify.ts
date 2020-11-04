import { Schema, Document } from "mongoose";
import { mongoose } from "./database";
import { getUserById, MongooseUserSchema } from "../routes/users/users-database";

declare type RequestType = "email-change" | "verify-account" | "password-change";
export interface IMongooseVerificationSchema extends Document {
  id: string;
  verificationCode: string;
  requestType: RequestType;
  storage: string;
}

const VerificationSchema = new Schema<IMongooseVerificationSchema>(
  {
    id: { type: String, required: true, unique: true },
    verificationCode: { type: String, required: true },
    requestType: String,
    storage: String,
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

const MongoVerification = mongoose.model<IMongooseVerificationSchema>("verifications", VerificationSchema);

export function getVerificationById(id: string): Promise<IMongooseVerificationSchema> {
  return new Promise((resolve, reject) => {
    MongoVerification.findOne({ id })
      .then(verification => {
        resolve(verification);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function findVerificationByVerificationKey(verificationCode: string): Promise<IMongooseVerificationSchema> {
  return new Promise(async (resolve, reject) => {
    //FIXME: IT ONLY WORK WHEN COLLECTION IS NOT EMPTY
    await MongoVerification.find({ verificationCode })
      .then(users => {
        if (users.length !== 0) resolve(users[0]);
        else reject();
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function addVerificationCodeToDatabase(
  id: string,
  verificationCode: string,
  requestType: RequestType,
  storage?: string,
): Promise<string> {
  return new Promise(async (resolve, rejects) => {
    try {
      let schema = await getVerificationById(id);
      if (!schema) {
        schema = new MongoVerification({
          id,
          verificationCode,
          requestType,
          storage: storage ? storage : null,
        });
      } else {
        schema.requestType = requestType;
        schema.verificationCode = verificationCode;
      }
      const object = await schema.save();
      resolve(object.verificationCode);
    } catch (error) {
      return rejects(error);
    }
  });
}

export function verifyCode(verificationCode: string): Promise<MongooseUserSchema> {
  return new Promise(async (resolve, rejects) => {
    // try {
    //   const schema = await findVerificationByVerificationKey(verificationCode);
    //   if (!schema) {
    //     rejects(new Error("Code not found"));
    //     return;
    //   }
    //   const user = await getUserById(schema.id);
    //   if (!user) {
    //     rejects(new Error("User not found"));
    //     return;
    //   }
    //   switch (schema.requestType) {
    //     case "password-change":
    //       user.password = schema.storage;
    //       break;
    //     case "email-change":
    //       user.email = schema.storage;
    //       break;
    //     default:
    //       break;
    //   }
    //   user.verified = true;
    //   await schema.remove();
    //   await user.save();
    //   resolve(user);
    // } catch (error) {
    //   rejects(error);
    // }
  });
}

export function generateVerificationCode() {
  const LENGTH = 49;
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
