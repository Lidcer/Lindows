import { Document, Schema } from 'mongoose';
import { mongoose } from '../../database/database';
import { IMongooseUserSchema } from '../users/users-database';
import { LypeStatus } from '../../../shared/ApiUsersRequestsResponds';

export interface IMongooseLypeUserSchema extends Document {
  userID: string;
  friends: string[];
  blocked: string[];
  customStatus: string;
  status: LypeStatus;
  online: boolean;
}

const LypeUserSchema = new Schema<IMongooseLypeUserSchema>(
  {
    userID: String,
    friends: [String],
    blocked: [String],
    customStatus: String,
    status: String,
    online: Boolean,
  },
  {
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  },
);

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
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  },
);

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

const LypeUser = mongoose.model<IMongooseLypeUserSchema>('LypeUser', LypeUserSchema);
const LypeChannel = mongoose.model<IMongooseLypeChannelSchema>('LypeChannel', LypeChannelSchema);
const LypeMessage = mongoose.model<IMongooseLypeMessageSchema>('LypeMessages', LypeMessageSchema);

export function getLypeUser(id: string): Promise<IMongooseLypeUserSchema> {
  return new Promise((resolve, reject) => {
    LypeUser.findOne({ userID: id })
      .then(u => resolve(u))
      .catch(err => reject(err));
  });
}

export function setupLypeUser(user: IMongooseUserSchema): Promise<IMongooseLypeUserSchema> {
  return new Promise((resolve, reject) => {
    LypeUser.findOne({ userID: user._id })
      .then(async r => {
        if (r) return resolve(r);
        const lypeUser = new LypeUser({
          userID: user._id,
          friends: [],
          blocked: [],
          customStatus: null,
          status: 'online',
          online: false,
        });
        await lypeUser.save();
        resolve(lypeUser);
      })
      .catch(err => reject(err));
  });
}

// returns true if friend has been added or
// false if friend has already been added
export function addFriends(
  target: IMongooseLypeUserSchema,
  friend: IMongooseLypeUserSchema,
  shouldSave = true,
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const isBlocked = target.blocked.find(u => u === friend.userID);
    if (isBlocked) return reject(new Error('User is on your user list'));
    const isFriend = target.friends.find(f => f === friend.userID);
    if (isFriend) return resolve(false);

    target.friends.push(friend.userID);
    if (shouldSave) await target.save();
    return resolve(true);
  });
}

// returns true if friend has been removed or
// false if friend has already been removed
export function removeFriends(
  target: IMongooseLypeUserSchema,
  friend: IMongooseLypeUserSchema,
  shouldSave = true,
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const isFriend = target.friends.find(f => f === friend.userID);
    if (!isFriend) return resolve(false);
    const indexOf = target.friends.indexOf(friend.userID);
    if (indexOf === -1) return reject(new Error('Something went horribly wrong'));
    target.friends.splice(indexOf, 1);
    if (shouldSave) await target.save();
    return resolve(true);
  });
}

export function areUsersFriends(user: IMongooseLypeUserSchema, anotherUser: IMongooseLypeUserSchema): boolean {
  return !!user.friends.find(f => f === anotherUser.userID);
}

// returns true if friend has been blocked or
// false if friend has already been blocked
export function blockUser(
  target: IMongooseLypeUserSchema,
  userToBlock: IMongooseLypeUserSchema,
  shouldSave = true,
): Promise<boolean> {
  return new Promise(async resolve => {
    const friend = target.friends.find(f => f === userToBlock.userID);
    if (friend) {
      const indexOf = target.friends.indexOf(friend);
      if (indexOf !== -1) {
        target.friends.splice(indexOf, 1);
      }
    }
    const isBlocked = target.blocked.find(b => b === userToBlock.userID);
    if (isBlocked) {
      await target.save();
      return resolve(false);
    }

    target.blocked.push(userToBlock.userID);
    if (shouldSave) await target.save();
    resolve(true);
  });
}

// returns true if friend isn't on block list or
// false if friend has already been blocked
export function unBlockUser(
  target: IMongooseLypeUserSchema,
  userToUnblock: IMongooseLypeUserSchema,
  shouldSave = true,
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const isBlocked = target.blocked.find(b => b === userToUnblock.userID);
    if (!isBlocked) return resolve(false);
    const indexOf = target.blocked.indexOf(userToUnblock.userID);
    if (indexOf !== -1) {
      target.blocked.splice(indexOf, 1);
    }
    if (shouldSave) await target.save();
    return resolve(true);
  });
}

export function updateCustomStatus(
  lypeUser: IMongooseLypeUserSchema,
  constStatus: string,
  shouldSave = true,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    lypeUser.customStatus = constStatus ? constStatus : null;
    if (shouldSave) await lypeUser.save();
    return resolve();
  });
}

export function addMessageToChannel(
  channel: IMongooseLypeChannelSchema,
  message: IMongooseLypeMessageSchema,
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const indexOf = channel.messages.indexOf(message._id);
    if (indexOf === -1) {
      channel.messages.push(message._id);
      await channel.save();
      return resolve(true);
    }
    return resolve(false);
  });
}
