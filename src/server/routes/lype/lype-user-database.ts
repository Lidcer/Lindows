import { Document, Schema } from 'mongoose';
import { mongoose } from '../../database/database';
import { IMongooseUserSchema, getUserById, getUserImage, findSimilarUser } from '../users/users-database';
import { ILypeAccount, LypeStatus } from '../../../shared/ApiLypeRequestsResponds';
import { logger } from '../../database/EventLog';

export interface IMongooseLypeUserSchema extends Document {
  userID: string;
  friends: string[];
  blocked: string[];
  friendRequests: string[];
  customStatus: string;
  easyDiscoverable: boolean;
  status: LypeStatus;
  online: boolean;
}

const LypeUserSchema = new Schema<IMongooseLypeUserSchema>(
  {
    userID: String,
    friends: [String],
    blocked: [String],
    friendRequests: [String],
    easyDiscoverable: Boolean,
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

const LypeUser = mongoose.model<IMongooseLypeUserSchema>('LypeUser', LypeUserSchema);

export async function findUsers(query: string) {
  try {
    const result = await getUserById(query);
    if (result) {
      try {
        const lypeAccount = await getLypeAccount(result);
        return [lypeAccount.lypeAccount];
      } catch (_) {
        return [];
      }
    }
  } catch (error) {
    /* ignored */
  }
  const searched = await findSimilarUser(query);

  if (searched.length) {
    return await getLypeUsers(searched);
  } else {
    return [];
  }
}

export async function getLypeUsers(users: IMongooseUserSchema[]) {
  const lypeUsers: ILypeAccount[] = [];
  for (const user of users) {
    try {
      const lypeAccount = await getLypeAccount(user);
      if (lypeAccount.lypeUser.easyDiscoverable) lypeUsers.push(lypeAccount.lypeAccount);
    } catch (_) {
      /* ignored */
    }
  }
  return lypeUsers;
}

export async function getLypeUserWithUserID(id: string) {
  const result = await LypeUser.findOne({ userID: id });
  return result;
}

export async function getLypeUser(id: string) {
  const result = await LypeUser.findOne({ _id: id });
  return result;
}

export async function getLypeUserWithUserWithUserID(id: string) {
  const lypeUser = await LypeUser.findOne({ userID: id });
  if (lypeUser) {
    const user = await getUserById(id);
    if (!user) return undefined;
    return { user, lypeUser };
  }
  return undefined;
}

export async function getLypeUserWithUser(id: string) {
  const lypeUser = await LypeUser.findOne({ _id: id });
  if (lypeUser) {
    const user = await getUserById(lypeUser.userID);
    if (!user) return undefined;
    return { user, lypeUser };
  }
  return undefined;
}

export async function setupLypeUser(user: IMongooseUserSchema): Promise<IMongooseLypeUserSchema> {
  const result = await LypeUser.findOne({ userID: user._id.toString() });
  if (result) return result;
  const lypeUser = new LypeUser({
    userID: user._id,
    friends: [],
    blocked: [],
    easyDiscoverable: true,
    customStatus: null,
    status: 'online',
    online: false,
  });

  await lypeUser.save();
  return lypeUser;
}

export async function getUserFriendsForClient(lypeUser: IMongooseLypeUserSchema) {
  const friendsID = lypeUser.friends;
  const blockedID = lypeUser.blocked;
  const filteredFriends: string[] = [];
  friendsID.forEach(e => {
    if (!blockedID.includes(e)) filteredFriends.push(e);
  });

  const result: ILypeAccount[] = [];

  for (const friend of filteredFriends) {
    try {
      const fetchedFriend = await getLypeUserWithUser(friend);
      if (!fetchedFriend) continue;
      if (!fetchedFriend.lypeUser.friends.includes(lypeUser._id.toString())) continue;
      if (fetchedFriend.user.banned) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error('Unable to get friend requests', error);
    }
  }
  logger.debug('friends', result);
  return result;
}

export async function getUserPendingFriendRequest(lypeUser: IMongooseLypeUserSchema) {
  const friendsID = lypeUser.friends;
  const blockedID = lypeUser.blocked;
  const filteredFriends: string[] = [];
  friendsID.forEach(e => {
    if (!blockedID.includes(e)) filteredFriends.push(e);
  });
  const result: ILypeAccount[] = [];
  for (const friend of filteredFriends) {
    try {
      const fetchedFriend = await getLypeUserWithUser(friend);
      if (!fetchedFriend) continue;
      if (!fetchedFriend.lypeUser.friendRequests.includes(lypeUser._id.toString())) continue;
      if (fetchedFriend.user.banned) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error('Unable to get friend requests', error);
    }
  }
  logger.debug('pending requests', result);
  return result;
}

export async function getUserBlocksForClient(lypeUser: IMongooseLypeUserSchema) {
  const blockedIDs = lypeUser.blocked;
  const result: ILypeAccount[] = [];

  for (const friend of blockedIDs) {
    try {
      const fetchedFriend = await getLypeUserWithUser(friend);
      if (!fetchedFriend) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error('Unable to get blocks', error);
    }
  }
  logger.debug('blocks', result);
  return result;
}

export async function getUserFriendsRequestForClient(lypeUser: IMongooseLypeUserSchema) {
  const friendsID = lypeUser.friendRequests;
  const blockedID = lypeUser.blocked;
  const filteredFriends: string[] = [];
  friendsID.forEach(e => {
    if (!blockedID.includes(e)) filteredFriends.push(e);
  });

  const result: ILypeAccount[] = [];

  for (const friend of filteredFriends) {
    try {
      const fetchedFriend = await getLypeUserWithUser(friend);
      logger.log('friend user', lypeUser._id.toString());
      if (!fetchedFriend.lypeUser.friends.includes(lypeUser._id.toString())) continue;
      if (fetchedFriend.user.banned) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error('Unable to get friend', error);
    }
  }
  logger.debug('friends requests', result);
  return result;
}

// returns true if friend has been added or
// false if friend has already been added
export async function addFriend(target: IMongooseLypeUserSchema, friend: IMongooseLypeUserSchema, shouldSave = true) {
  const isBlocked = target.blocked.find(u => u === friend._id.toString());
  if (isBlocked) throw new Error('User is on your user block list');
  const isFriend = target.friends.indexOf(friend._id.toString());
  const onFriendList = target.friendRequests.indexOf(friend._id.toString());
  if (onFriendList !== -1) {
    target.friendRequests.splice(onFriendList, 1);
    if (isFriend === -1) {
      target.friends.push(friend._id.toString());
    }
    if (shouldSave) {
      await target.save();
      await friend.save();
    }
    return true;
  }

  if (isFriend !== -1) {
    return false;
  }

  target.friends.push(friend._id.toString());
  if (friend.friendRequests.indexOf(target._id.toString()) === -1) friend.friendRequests.push(target._id.toString());
  if (shouldSave) {
    await target.save();
    await friend.save();
  }
  return true;
}

// returns true if friend has been removed or
// false if friend has already been removed
export async function removeFriend(
  target: IMongooseLypeUserSchema,
  friend: IMongooseLypeUserSchema,
  shouldSave = true,
) {
  const targetIndexOf = target.friends.indexOf(friend._id.toString());
  if (targetIndexOf !== -1) target.friends.splice(targetIndexOf, 1);

  const targetIndexOfFriendRequests = target.friendRequests.indexOf(friend._id.toString());
  if (targetIndexOfFriendRequests !== -1) target.friendRequests.splice(targetIndexOfFriendRequests, 1);

  const friendOfFriends = friend.friends.indexOf(target._id.toString());
  if (friendOfFriends !== -1) friend.friends.splice(friendOfFriends, 1);

  const friendsIndexOfFriendRequest = friend.friendRequests.indexOf(target._id.toString());
  if (friendsIndexOfFriendRequest !== -1) friend.friendRequests.splice(friendsIndexOfFriendRequest, 1);

  if (friendsIndexOfFriendRequest === -1 && friendOfFriends === -1 && friendOfFriends === -1 && targetIndexOf === -1) {
    return false;
  }

  if (shouldSave) {
    await target.save();
    await friend.save();
  }
  return true;
}

export function areUsersFriends(user: IMongooseLypeUserSchema, anotherUser: IMongooseLypeUserSchema): boolean {
  return !!user.friends.find(f => f === anotherUser.toString());
}

// returns true if friend has been blocked or
// false if friend has already been blocked
export async function blockUser(
  target: IMongooseLypeUserSchema,
  userToBlock: IMongooseLypeUserSchema,
  shouldSave = true,
): Promise<boolean> {
  const friend = await target.friends.find(f => f === userToBlock._id.toString());
  if (friend) {
    const indexOf = target.friends.indexOf(friend);
    if (indexOf !== -1) {
      target.friends.splice(indexOf, 1);
    }
  }
  const isBlocked = target.blocked.find(b => b === userToBlock._id.toString());
  if (isBlocked) {
    await target.save();
    return false;
  }

  target.blocked.push(userToBlock.userID);
  if (shouldSave) await target.save();
  return true;
}

// returns true if friend isn't on block list or
// false if friend has already been blocked
export async function unBlockUser(
  target: IMongooseLypeUserSchema,
  userToUnblock: IMongooseLypeUserSchema,
  shouldSave = true,
): Promise<boolean> {
  const isBlocked = await target.blocked.find(b => b === userToUnblock._id.toString());
  if (!isBlocked) return false;
  const indexOf = target.blocked.indexOf(userToUnblock._id.toString());
  if (indexOf !== -1) {
    target.blocked.splice(indexOf, 1);
  }
  if (shouldSave) await target.save();
  return true;
}

export async function updateCustomStatus(
  lypeUser: IMongooseLypeUserSchema,
  constStatus: string,
  shouldSave = true,
): Promise<void> {
  lypeUser.customStatus = constStatus ? constStatus : null;
  if (shouldSave) await lypeUser.save();
}

export async function getLypeAccount(user: IMongooseUserSchema) {
  const lypeUser = await getLypeUserWithUserID(user._id.toString());
  if (!lypeUser) throw new Error('User does not have lype account');
  const lypeAccount: ILypeAccount = {
    id: user._id.toString(),
    username: user.username,
    customStatus: lypeUser.customStatus,
    displayedName: user.displayedName,
    status: lypeUser.status,
    avatar: getUserImage(user),
  };
  return { lypeAccount, lypeUser };
}

export function lypeAccountForClient(user: IMongooseUserSchema, lypeUser: IMongooseLypeUserSchema) {
  const lypeAccount: ILypeAccount = {
    id: user._id.toString(),
    username: user.username,
    customStatus: lypeUser.customStatus,
    displayedName: user.displayedName,
    status: lypeUser.status,
    avatar: getUserImage(user),
  };
  return lypeAccount;
}
