import { Document, Schema } from "mongoose";
import { mongoose } from "../../database/database";
import { IMongooseLypeChannelSchema } from "./lype-channel-database";

export interface IMongooseLypeMessageSchema extends Document {
  userID: string;
  content: string;
  timeStampCrated: number;
  editedTimeStamp: number;
  files: string[];
  seen: string[];
}

const LypeMessageSchema = new Schema<IMongooseLypeMessageSchema>(
  {
    userID: String,
    content: String,
    cratedAt: Number,
    editedAt: Number,
    files: [String],
    seen: [String],
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

const LypeMessage = mongoose.model<IMongooseLypeMessageSchema>("LypeMessages", LypeMessageSchema);

export async function addMessageToChannel(channel: IMongooseLypeChannelSchema, message: IMongooseLypeMessageSchema) {
  const indexOf = channel.messages.indexOf(message._id);
  if (indexOf === -1) {
    channel.messages.push(message._id);
    await channel.save();
    return true;
  }
  return false;
}
