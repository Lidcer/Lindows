import { Response, Request } from "express";
import { getUserImage, UserModifiable } from "./users/users-database";
import { IResponse, IAccount, VerificationType } from "../../shared/ApiUsersRequestsResponds";
import { ObjectSchema } from "@hapi/joi";
import { TOKEN_HEADER } from "../../shared/constants";
import * as jwt from "jsonwebtoken";
import { logger } from "../database/EventLog";
import { PRIVATE_KEY } from "../config";

export interface IJWTAccount {
  id: string;
  exp: number;
}

export interface IJWVerificationCode extends IJWTAccount {
  type: VerificationType;
  data?: string;
}

export function rIsUserForbidden(res: Response, user: UserModifiable, verification = false): boolean {
  if (!user) {
    respondWithError(res, 400, "Account does not exist");
    return true;
  }
  if (!user.verified && verification) {
    respondWithError(res, 400, "User has not verified email");
    return true;
  }
  if (user.banned) {
    respondWithError(res, 400, "Account has been banned");
    return true;
  }
  if (user.compromised) {
    respondWithError(res, 400, "Account has been compromised");
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

export function getClientAccount(user: UserModifiable): IAccount {
  return {
    displayedName: user.displayedName,
    id: user.id,
    username: user.username,
    avatar: getUserImage(user),
  };
}

export async function rGetTokenData(
  req: Request,
  res: Response,
  verification = false,
  privateKey = PRIVATE_KEY,
): Promise<IJWTAccount | IJWVerificationCode | null> {
  const token = req.header(TOKEN_HEADER);
  if (!token) {
    respondWithError(res, 400, "Missing token");
    return null;
  }
  if (typeof token !== "string") {
    respondWithError(res, 400, "Invalid token provided");
    return null;
  }
  let data: IJWVerificationCode;
  try {
    const d = (await jwt.verify(token, privateKey)) as IJWVerificationCode;
    data = d;
  } catch (error) {
    respondWithError(res, 400, "Invalid token");
    return null;
  }

  if (!data) {
    respondWithError(res, 400, "Invalid token");
    return null;
  }
  if (data.id && data.exp) {
    if (typeof data.exp !== "number") {
      respondWithError(res, 400, "Invalid token");
      return null;
    }
    if (data.exp < Date.now()) {
      respondWithError(res, 401, "Token has expired");
      return null;
    }
    if (verification && !data.type) {
      respondWithError(res, 401, "Problem with token");
      return null;
    }
    return data;
  }
  respondWithError(res, 400, "Could not authenticate user");
  return null;
}

export async function getTokenData(req?: Request, token?: string): Promise<IJWTAccount | null> {
  if (!req && !token) return null;
  if (!token && req) {
    const t = req.headers[TOKEN_HEADER];
    if (typeof t !== "string") return null;
    token = t;
  }
  if (!token) return null;
  if (typeof token !== "string") return null;
  let data: IJWVerificationCode;
  try {
    const d = (await jwt.verify(token, PRIVATE_KEY)) as IJWVerificationCode;
    data = d;
  } catch (error) {
    logger.debug("Token verify", error);
    return null;
  }
  if (!data) return null;

  if (data.id && data.exp) {
    if (typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return data;
  }
  return null;
}

export function getIpFromRequest(req: Request) {
  return req.header("x-forwarded-for") || req.connection.remoteAddress || req.ip || "";
}

export async function setToken(req: Request, res: Response, token: string) {
  req.session.token = token;
  res.header(TOKEN_HEADER, token);
  await saveSession(req);
}

export function getToken(req: Request) {
  return getTokenFromSession(req) || getTokenFromHeader(req);
}

export function getTokenFromHeader(req: Request) {
  return req.header(TOKEN_HEADER);
}

export function getTokenFromSession(req: Request) {
  return req.session.token;
}

export function saveSession(req: Request) {
  return new Promise<boolean>(resolve => {
    req.session.save(err => {
      if (err) {
        logger.error("Unable to save session", err);
      }
      return resolve();
    });
  });
}
