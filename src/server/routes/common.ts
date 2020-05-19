import { Response, Request } from 'express';
import { IMongooseUserSchema, getUserImage } from './users/users-database';
import { IResponse, IAccount, VerificationType } from '../../shared/ApiUsersRequestsResponds';
import { ObjectSchema } from '@hapi/joi';
import { TOKEN_HEADER } from '../../shared/constants';
import * as jwt from 'jsonwebtoken';
import { logger } from '../database/EventLog';

export interface IJWTAccount {
  id: string;
  exp: number;
}

export interface IJWVerificationCode extends IJWTAccount {
  type: VerificationType;
  data?: string;
}

export function rIsUserForbidden(res: Response, user: IMongooseUserSchema, verification = false): boolean {
  if (!user) {
    respondWithError(res, 400, 'Account does not exist');
    return true;
  }
  if (!user.verified && verification) {
    respondWithError(res, 400, 'User has not verified email');
    return true;
  }
  if (user.banned) {
    respondWithError(res, 400, 'Account has been banned');
    return true;
  }
  if (user.compromised) {
    respondWithError(res, 400, 'Account has been compromised');
    return true;
  }
  return false;
}

export function verifyJoi<A>(req: Request, res: Response, joiObject: ObjectSchema): A | null {
  const body: A = req.body;
  const response: IResponse<null> = {};

  const joiResult = joiObject.validate(body);
  if (joiResult.error) {
    response.error = joiResult.error.message;
    response.details = joiResult.error;
    res.status(400).json(response);
    logger.error(`Joi verification failed`, req.originalUrl, req.body);
    return null;
  }
  return body;
}

export function respondWithError(res: Response, status: number, error: string, details?: any) {
  const response: IResponse<null> = { error };
  if (details) response.details = details;
  logger.debug(`Error response`, status, error, response);
  res.status(status).json(response);
}

export function getClientAccount(user: IMongooseUserSchema): IAccount {
  return {
    displayedName: user.displayedName,
    id: user._id,
    username: user.username,
    avatar: getUserImage(user),
  };
}

export function rGetTokenData(
  req: Request,
  res: Response,
  verificaiton = false,
): IJWTAccount | IJWVerificationCode | null {
  const token = req.headers[TOKEN_HEADER];
  if (!token) {
    respondWithError(res, 400, 'Missing token');
    return null;
  }
  if (typeof token !== 'string') {
    respondWithError(res, 400, 'Invalid token provided');
    return null;
  }
  const data = jwt.decode(token) as IJWVerificationCode;
  if (!data) {
    respondWithError(res, 400, 'Invalid token');
    return null;
  }
  if (data.id && data.exp) {
    if (typeof data.exp !== 'number') {
      respondWithError(res, 400, 'Invalid token');
      return null;
    }
    if (data.exp < Date.now()) {
      respondWithError(res, 401, 'Token has expired');
      return null;
    }
    if (verificaiton && !data.type) {
      respondWithError(res, 401, 'Problem with token');
      return null;
    }
    return data;
  }
  respondWithError(res, 400, 'Could not authenticate user');
  return null;
}

export function getTokenData(req?: Request, token?: string): IJWTAccount | null {
  if (!req && !token) return null;
  if (!token && req) {
    const t = req.headers[TOKEN_HEADER];
    if (typeof t !== 'string') return null;
    token = t;
  }
  if (!token) return null;
  if (typeof token !== 'string') return null;
  const data = jwt.decode(token) as IJWVerificationCode;
  if (!data) return null;

  if (data.id && data.exp) {
    if (typeof data.exp !== 'number') return null;
    if (data.exp < Date.now()) return null;
    return data;
  }
  return null;
}
