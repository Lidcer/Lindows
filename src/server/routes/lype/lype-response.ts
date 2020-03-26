import { Request, Response } from 'express';
import { IResponse } from '../../../shared/ApiUsersRequestsResponds';
import { ILypeAccount, ILypeAccountResponse } from '../../../shared/ApiLypeRequestsResponds';
import { respondWithError, rGetTokenData, rIsUserForbidden, getClientAccount } from '../common';
import { logError } from '../Error';
import { getLypeUser, IMongooseLypeUserSchema, setupLypeUser } from './lype-database';
import { getUserById, IMongooseUserSchema } from '../users/users-database';

export async function checkLypeUser(req: Request, res: Response) {
  const result = rGetTokenData(req, res);
  if (!result) return;

  try {
    const lypeUser = await getLypeUser(result.id);
    if (!lypeUser) {
      const response: IResponse<string> = {
        error: 'You do not have lype account',
        message: 'You do not have lype account',
      };
      return res.status(200).json(response);
    }

    const user = await getUserById(lypeUser.userID);
    if (rIsUserForbidden(res, user)) return;

    const response: ILypeAccountResponse = {
      success: getClientLypeUser(lypeUser, user),
      message: `Welcome ${user.displayedName}`,
    };

    return res.status(200).json(response);
  } catch (error) {
    logError(error, 'Checking out lype user');
  }
  respondWithError(res, 500, 'Internal server error');
}

export async function createLypeUser(req: Request, res: Response) {
  const result = rGetTokenData(req, res);
  if (!result) return;

  try {
    const user = await getUserById(result.id);
    if (rIsUserForbidden(res, user)) return;
    const lypeUser = await setupLypeUser(user);
    const response: ILypeAccountResponse = {
      success: getClientLypeUser(lypeUser, user),
      message: `Success`,
    };

    return res.status(200).json(response);
  } catch (error) {
    logError(error, 'database');
  }
  respondWithError(res, 500, 'Checking out lype user');
}

export async function findLypeFriend(req: Request, res: Response) {
  const result = rGetTokenData(req, res);
  if (!result) return;

  try {
    const user = await getUserById(result.id);
    if (rIsUserForbidden(res, user)) return;
    const lypeUser = await setupLypeUser(user);

    const response: ILypeAccountResponse = {
      success: getClientLypeUser(lypeUser, user),
      message: `Success`,
    };

    ///

    return res.status(200).json(response);
  } catch (error) {
    logError(error, 'database');
  }
  respondWithError(res, 500, 'Checking out lype user');
}

export async function addLypeFriend(req: Request, res: Response) {
  respondWithError(res, 500, 'Checking out lype user');
}

export async function removeLypeFriend(req: Request, res: Response) {
  respondWithError(res, 500, 'Checking out lype user');
}

export async function blockLypeUser(req: Request, res: Response) {
  respondWithError(res, 500, 'Checking out lype user');
}

export async function unblockLypeUser(req: Request, res: Response) {
  respondWithError(res, 500, 'Checking out lype user');
}

function getClientLypeUser(lypeUser: IMongooseLypeUserSchema, user: IMongooseUserSchema): ILypeAccount {
  if (lypeUser.userID.toString() !== user._id.toString()) throw new Error('Lype user does not match with user');
  const lypeParams = {
    status: lypeUser.status,
    customStatus: lypeUser.customStatus,
  };
  return { ...getClientAccount(user), ...lypeParams };
}
