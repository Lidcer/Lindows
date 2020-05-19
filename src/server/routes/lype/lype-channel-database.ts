import { Document, Schema } from 'mongoose';
import { mongoose } from '../../database/database';

type ChannelType = 'group' | 'dm';
export interface IMongooseLypeChannelSchema extends Document {
  type: ChannelType;
  messages: string[];
  createdAt: number;
  lastActiveAt: number;
}

const LypeChannelSchema = new Schema<IMongooseLypeChannelSchema>(
  {
    type: String,
    messages: [String],
    createdAt: Number,
    lastActiveAt: Number,
  },
  {
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  },
);

const LypeChannel = mongoose.model<IMongooseLypeChannelSchema>('LypeChannel', LypeChannelSchema);
