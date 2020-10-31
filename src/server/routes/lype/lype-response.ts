import { Request, Response } from "express";
import { IResponse } from "../../../shared/ApiUsersRequestsResponds";
import {
  ILypeAccount,
  ILypeAccountResponse,
  ILypeClientAccountResponse,
  ILypeSearchQuery,
  IClientAccount,
  ILypeFriendsQueryResponse,
  ILypeUserID,
} from "../../../shared/ApiLypeRequestsResponds";
import { respondWithError, rGetTokenData, rIsUserForbidden, getClientAccount, verifyJoi } from "../common";
import {
  getLypeUserWithUserID,
  IMongooseLypeUserSchema,
  setupLypeUser,
  getUserFriendsRequestForClient,
  getUserBlocksForClient,
  getUserFriendsForClient,
  getUserPendingFriendRequest,
  findUsers,
  addFriend,
  getLypeUserWithUserWithUserID,
  removeFriend,
} from "./lype-user-database";
import { getUserById, IMongooseUserSchema } from "../users/users-database";
import { joi$LypeSearchQuery, joi$LypeUserID } from "./lype-joies";
import { logger } from "../../database/EventLog";
import { TOKEN_HEADER } from "../../../shared/constants";

export async function checkLypeUser(req: Request, res: Response) {
  logger.debug("checking user", req.headers[TOKEN_HEADER]);
  const result = await rGetTokenData(req, res);
  if (!result) return;

  try {
    const lypeUser = await getLypeUserWithUserID(result.id);
    if (!lypeUser) {
      const response: IResponse<string> = {
        error: "You do not have lype account",
        message: "You do not have lype account",
      };
      logger.debug("User does not have an account", response);
      return res.status(200).json(response);
    }
    const user = await getUserById(lypeUser.userID);
    if (rIsUserForbidden(res, user)) return;
    logger.debug("User found", user.username);

    const lypeUserClient = await getClientLypeUser(lypeUser, user);
    const response: ILypeClientAccountResponse = {
      success: lypeUserClient,
      message: `Welcome ${user.displayedName}`,
    };

    logger.debug("Check user response", response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error("checking user error", error);
  }
  respondWithError(res, 500, "Internal server error");
}

export async function createLypeUser(req: Request, res: Response) {
  logger.debug("create lype user", req.headers[TOKEN_HEADER]);
  const result = await rGetTokenData(req, res);
  if (!result) return;

  try {
    const user = await getUserById(result.id);
    if (rIsUserForbidden(res, user)) return;
    const lypeUser = await setupLypeUser(user);
    logger.debug("lype user created", lypeUser.userID);

    const response: ILypeAccountResponse = {
      success: await getClientLypeUser(lypeUser, user),
      message: `Success`,
    };

    logger.debug("lype user create response", response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error("Create lype user error", error);
  }
  respondWithError(res, 500, "Checking out lype user");
}

export async function findLypeUsers(req: Request, res: Response) {
  logger.debug("Find lype users", req.body);
  const result = await rGetTokenData(req, res);
  if (!result) return;
  const request = verifyJoi<ILypeSearchQuery>(req, res, joi$LypeSearchQuery);

  try {
    const user = await getUserById(result.id);
    if (rIsUserForbidden(res, user)) return;
    //const lypeUser = await setupLypeUser(user);
    const users = await findUsers(request.query);

    const response: ILypeFriendsQueryResponse = {
      success: { users },
      message: `Found ${users.length} Users`,
    };

    logger.debug("Find lype user response", response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error("unable to find lype user", error);
  }
  respondWithError(res, 500, "Checking out lype user");
}

export async function fetchLypeFriends(req: Request, res: Response) {
  const result = await rGetTokenData(req, res);
  if (!result) return;

  try {
    const user = await getUserById(result.id);
    if (rIsUserForbidden(res, user)) return;

    //    return res.status(200).json(response);
  } catch (error) {
    logger.error(error, "database");
  }
  respondWithError(res, 500, "Checking out lype user");
}

export async function addLypeFriend(req: Request, res: Response) {
  logger.debug("Find add friend", req.body);

  const result = await rGetTokenData(req, res);
  if (!result) return;
  const request = verifyJoi<ILypeUserID>(req, res, joi$LypeUserID);

  try {
    const users = await getLypeUserWithUserWithUserID(result.id);
    if (rIsUserForbidden(res, users.user)) return;
    if (result.id === request.userID) {
      return respondWithError(res, 400, "You cannot be friend with yourself");
    }

    const friend = await getLypeUserWithUserID(request.userID);
    if (!friend) {
      return respondWithError(res, 400, "Friend account does not exist");
    }
    const usefully = await addFriend(users.lypeUser, friend);
    if (!usefully) {
      return respondWithError(res, 400, "Friend is already on friend list");
    }

    const response: ILypeAccountResponse = {
      success: await getClientLypeUser(users.lypeUser, users.user),
      message: `Success`,
    };

    logger.debug("Friend added to pending", response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error("Unable to add friend lype user", error);
  }
  respondWithError(res, 500, "Internal server error");
}

export async function removeLypeFriend(req: Request, res: Response) {
  logger.debug("Remove friend", req.body);

  const result = await rGetTokenData(req, res);
  if (!result) return;
  const request = verifyJoi<ILypeUserID>(req, res, joi$LypeUserID);

  try {
    const users = await getLypeUserWithUserWithUserID(result.id);
    if (rIsUserForbidden(res, users.user)) return;
    if (result.id === request.userID) {
      return respondWithError(res, 400, "You cannot remove yourself from friends");
    }

    const friend = await getLypeUserWithUserID(request.userID);
    if (!friend) {
      return respondWithError(res, 400, "Friend account does not exist");
    }
    const usefully = await removeFriend(users.lypeUser, friend);
    if (!usefully) {
      return respondWithError(res, 400, "Friend is not on your friends list");
    }

    const response: ILypeAccountResponse = {
      success: await getClientLypeUser(users.lypeUser, users.user),
      message: `Success`,
    };

    logger.debug("Friend removed from list", response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error("Unable to remove friend", error);
  }

  respondWithError(res, 500, "Internal server error");
}

export async function blockLypeUser(req: Request, res: Response) {
  respondWithError(res, 500, "Checking out lype user");
}

export async function unblockLypeUser(req: Request, res: Response) {
  respondWithError(res, 500, "Checking out lype user");
}

async function getClientLypeUser(
  lypeUser: IMongooseLypeUserSchema,
  user: IMongooseUserSchema,
): Promise<IClientAccount> {
  if (lypeUser.userID.toString() !== user._id.toString()) throw new Error("Lype user does not match with user");

  const friends = await getUserFriendsForClient(lypeUser);
  const friendRequest = await getUserFriendsRequestForClient(lypeUser);
  const pendingRequest = await getUserPendingFriendRequest(lypeUser);
  const blocked = await getUserBlocksForClient(lypeUser);

  const lypeParams = {
    status: lypeUser.status,
    customStatus: lypeUser.customStatus,
    friends,
    friendRequest,
    pendingRequest,
    blocked,
  };
  return { ...getClientAccount(user), ...lypeParams };
}
