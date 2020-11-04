import { Document, Schema } from "mongoose";
import { mongoose } from "../../database/database";
import {
  MongooseUserSchema,
  getUserImage,
  UserModifiable,
  getUserById,
  findSimilarUser,
} from "../users/users-database";
import { ILypeAccount, LypeStatus } from "../../../shared/ApiLypeRequestsResponds";
import { logger } from "../../database/EventLog";
import { Model, where } from "sequelize";
import { ID, isMongo, isMySql, Modifiable } from "../../database/modifiable";

interface LypeUser {
  userID: string;
  friends: string[] | string;
  blocked: string[] | string;
  friendRequests: string[] | string;
  customStatus: string;
  easyDiscoverable: boolean;
  status: LypeStatus;
  online: boolean;
}

export interface IMongooseLypeUserSchema extends Document, LypeUser {}

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
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

const MongoLypeUser = mongoose.model<IMongooseLypeUserSchema>("LypeUser", LypeUserSchema);

interface SqlLypeUser extends LypeUser, ID {}
class LypeUserMySql extends Model<SqlLypeUser, LypeUser> implements LypeUser {
  public readonly id: number;
  public userID: string;
  public friends: string[];
  public blocked: string[];
  public friendRequests: string[];
  public customStatus: string;
  public easyDiscoverable: boolean;
  public status: LypeStatus;
  public online: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class LypeUserModifiable extends Modifiable<IMongooseLypeUserSchema, LypeUserMySql> implements LypeUser {
  get id() {
    if (this.isMongo(this.db)) {
      return this.db._id.toString();
    } else if (this.isMySql) {
      return this.db.id;
    }
  }

  get userID(): string {
    return this.db.userID;
  }
  set userID(userID: string) {
    this.db.userID = userID;
  }
  get friends(): string[] {
    return this.toArray(this.db.friends);
  }
  set friends(friends: string[]) {
    this.db.friends = this.fromArray(friends);
  }
  get blocked(): string[] {
    return this.toArray(this.db.blocked);
  }
  set blocked(blocked: string[]) {
    this.db.blocked = blocked;
  }
  get friendRequests(): string[] {
    return this.toArray(this.db.friendRequests);
  }
  set friendRequests(friendRequests: string[]) {
    this.db.friendRequests = friendRequests;
  }
  get customStatus(): string {
    return this.db.customStatus;
  }
  set customStatus(customStatus: string) {
    this.db.customStatus = customStatus;
  }
  get easyDiscoverable(): boolean {
    return this.db.easyDiscoverable;
  }
  set easyDiscoverable(easyDiscoverable: boolean) {
    this.db.easyDiscoverable = easyDiscoverable;
  }
  get status(): LypeStatus {
    return this.db.status;
  }
  set status(status: LypeStatus) {
    this.db.status = status;
  }
  get online(): boolean {
    return this.db.online;
  }
  set online(online: boolean) {
    this.db.online = online;
  }

  async save() {
    await this.db.save();
    return this;
  }
  async remove() {
    if (this.isMongo(this.db)) {
      await this.db.remove();
    } else if (this.isMySql(this.db)) {
      await this.db.destroy();
    }
  }
}

type LypeUserDbType = IMongooseLypeUserSchema | LypeUserMySql;

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

export async function getLypeUsers(users: UserModifiable[]) {
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
  let userUser: LypeUserDbType | undefined = undefined;
  if (isMongo()) {
    userUser = await MongoLypeUser.findById({ userID: id });
  } else if (isMySql()) {
    userUser = await LypeUserMySql.findOne({ where: { userID: id } });
  }
  if (!userUser) return undefined;
  return new LypeUserModifiable(userUser);
}

export async function getLypeUserById(id: string) {
  let userUser: LypeUserDbType | undefined = undefined;
  if (isMongo()) {
    userUser = await MongoLypeUser.findById(id);
  } else if (isMySql()) {
    userUser = await LypeUserMySql.findByPk(parseInt(id));
  }
  if (!userUser) return undefined;
  return new LypeUserModifiable(userUser);
}

export async function getLypeUserWithUserWithUserID(id: string) {
  const lypeUser = await getLypeUserWithUserID(id);
  if (lypeUser) {
    const user = await getUserById(id);
    if (!user) return undefined;
    return { user, lypeUser };
  }
  return undefined;
}

export async function getLypeUserWithUser(id: string) {
  const lypeUser = await getLypeUserById(id);
  if (lypeUser) {
    const user = await getUserById(lypeUser.userID);
    if (!user) return undefined;
    return { user, lypeUser };
  }
  return undefined;
}

export async function setupLypeUser(user: UserModifiable): Promise<LypeUserModifiable> {
  const result = await getLypeUserWithUserID(user.id);
  if (result) return result;

  const lypeUser: LypeUser = {
    userID: user.id,
    friends: isMongo() ? [] : "[]",
    blocked: [],
    easyDiscoverable: true,
    customStatus: null,
    status: "online",
    online: false,
    friendRequests: isMongo() ? [] : "[]",
  };

  if (isMongo()) {
    const mongoUser = new MongoLypeUser(lypeUser);
    await mongoUser.save();
    return new LypeUserModifiable(mongoUser);
  } else if (isMySql()) {
    const lypeUserMySql = await LypeUserMySql.create(lypeUser);
    await lypeUserMySql.save();
    return new LypeUserModifiable(lypeUserMySql);
  }

  return undefined;
}

export async function getUserFriendsForClient(lypeUser: LypeUserModifiable) {
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
      if (!fetchedFriend.lypeUser.friends.includes(lypeUser.id.toString())) continue;
      if (fetchedFriend.user.banned) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error("Unable to get friend requests", error);
    }
  }
  logger.debug("friends", result);
  return result;
}

export async function getUserPendingFriendRequest(lypeUser: LypeUserModifiable) {
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
      if (!fetchedFriend.lypeUser.friendRequests.includes(lypeUser.id.toString())) continue;
      if (fetchedFriend.user.banned) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error("Unable to get friend requests", error);
    }
  }
  logger.debug("pending requests", result);
  return result;
}

export async function getUserBlocksForClient(lypeUser: LypeUserModifiable) {
  const blockedIDs = lypeUser.blocked;
  const result: ILypeAccount[] = [];
  for (const friend of blockedIDs) {
    try {
      const fetchedFriend = await getLypeUserWithUser(friend);
      if (!fetchedFriend) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error("Unable to get blocks", error);
    }
  }
  logger.debug("blocks", result);
  return result;
}

export async function getUserFriendsRequestForClient(lypeUser: LypeUserModifiable) {
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
      logger.log("friend user", lypeUser.id.toString());
      if (!fetchedFriend.lypeUser.friends.includes(lypeUser.id.toString())) continue;
      if (fetchedFriend.user.banned) continue;
      result.push(lypeAccountForClient(fetchedFriend.user, fetchedFriend.lypeUser));
    } catch (error) {
      logger.error("Unable to get friend", error);
    }
  }
  logger.debug("friends requests", result);
  return result;
}

// returns true if friend has been added or
// false if friend has already been added
export async function addFriend(target: LypeUserModifiable, friend: LypeUserModifiable, shouldSave = true) {
  const isBlocked = target.blocked.find(u => u === friend.id.toString());
  if (isBlocked) throw new Error("User is on your user block list");
  const isFriend = target.friends.indexOf(friend.id.toString());
  const onFriendList = target.friendRequests.indexOf(friend.id.toString());
  if (onFriendList !== -1) {
    target.friendRequests.splice(onFriendList, 1);
    if (isFriend === -1) {
      target.friends.push(friend.id.toString());
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

  target.friends.push(friend.id.toString());
  if (friend.friendRequests.indexOf(target.id.toString()) === -1) friend.friendRequests.push(target.id.toString());
  if (shouldSave) {
    await target.save();
    await friend.save();
  }
  return true;
}

// returns true if friend has been removed or
// false if friend has already been removed
export async function removeFriend(target: LypeUserModifiable, friend: LypeUserModifiable, shouldSave = true) {
  const targetIndexOf = target.friends.indexOf(friend.id.toString());
  if (targetIndexOf !== -1) target.friends.splice(targetIndexOf, 1);

  const targetIndexOfFriendRequests = target.friendRequests.indexOf(friend.id.toString());
  if (targetIndexOfFriendRequests !== -1) target.friendRequests.splice(targetIndexOfFriendRequests, 1);

  const friendOfFriends = friend.friends.indexOf(target.id.toString());
  if (friendOfFriends !== -1) friend.friends.splice(friendOfFriends, 1);

  const friendsIndexOfFriendRequest = friend.friendRequests.indexOf(target.id.toString());
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

export function areUsersFriends(user: LypeUserModifiable, anotherUser: LypeUserModifiable): boolean {
  return !!user.friends.find(f => f === anotherUser.toString());
}

// returns true if friend has been blocked or
// false if friend has already been blocked
export async function blockUser(
  target: LypeUserModifiable,
  userToBlock: LypeUserModifiable,
  shouldSave = true,
): Promise<boolean> {
  const friend = await target.friends.find(f => f === userToBlock.id.toString());
  if (friend) {
    const indexOf = target.friends.indexOf(friend);
    if (indexOf !== -1) {
      target.friends.splice(indexOf, 1);
    }
  }
  const isBlocked = target.blocked.find(b => b === userToBlock.id.toString());
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
  target: LypeUserModifiable,
  userToUnblock: LypeUserModifiable,
  shouldSave = true,
): Promise<boolean> {
  const isBlocked = await target.blocked.find(b => b === userToUnblock.id);
  if (!isBlocked) return false;
  const indexOf = target.blocked.indexOf(userToUnblock.id.toString());
  if (indexOf !== -1) {
    target.blocked.splice(indexOf, 1);
  }
  if (shouldSave) await target.save();
  return true;
}

export async function updateCustomStatus(
  lypeUser: LypeUserModifiable,
  constStatus: string,
  shouldSave = true,
): Promise<void> {
  lypeUser.customStatus = constStatus ? constStatus : null;
  if (shouldSave) await lypeUser.save();
}

export async function getLypeAccount(user: UserModifiable) {
  const lypeUser = await getLypeUserWithUserID(user.id.toString());
  if (!lypeUser) throw new Error("User does not have lype account");
  const lypeAccount: ILypeAccount = {
    id: user.id.toString(),
    username: user.username,
    customStatus: lypeUser.customStatus,
    displayedName: user.displayedName,
    status: lypeUser.status,
    avatar: getUserImage(user),
  };
  return { lypeAccount, lypeUser };
}

export function lypeAccountForClient(user: UserModifiable, lypeUser: LypeUserModifiable) {
  const lypeAccount: ILypeAccount = {
    id: user.id.toString(),
    username: user.username,
    customStatus: lypeUser.customStatus,
    displayedName: user.displayedName,
    status: lypeUser.status,
    avatar: getUserImage(user),
  };
  return lypeAccount;
}
