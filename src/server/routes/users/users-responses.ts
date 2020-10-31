import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { TOKEN_HEADER, WEEK, HOUR } from "../../../shared/constants";
import { profanity } from "@2toad/profanity";

import {
  registerUserInDatabase,
  findUserByName,
  findUserByEmail,
  getUserByAccountOrEmail,
  changePasswordOnAccount,
  getUserById,
  IMongooseUserSchema,
  changeAvatar,
  getUserImage,
  changeEmailOnAccount,
  doesUserWithDisplayedNamesExist,
} from "./users-database";
import { PRIVATE_KEY } from "../../config";
import {
  joi$registerUser,
  joi$loginUser,
  joi$changePassword,
  joi$changeEmail,
  joi$displayedName,
  joi$verification,
  joi$resetPassword,
  joi$deleteAccount,
  joi$email,
} from "./users-joies";
import {
  IAccountRegisterRequest,
  IAccountLoginRequest,
  IAccountChangePasswordRequest,
  IAccountChangeEmailRequest,
  IAccountResponse,
  IResponse,
  IAccountDisplayedNameRequest,
  IAccountVerificationRequest,
  IAccountVerificationPassword,
  IAccountDeleteAccountRequest,
  VerificationType,
  IAccountEmailRequest,
} from "../../../shared/ApiUsersRequestsResponds";
import { verifyPassword } from "../../database/passwordHasher";
import { SpamProtector } from "../SpamProtector";
import fileUpload = require("express-fileupload");
import { randomBytes } from "crypto";
import { mailService } from "../../main";
import { isTokenBlackListed, addTokenToBlackList } from "../../database/tokensBlacklist";
import { IMailAccountInfo } from "../mail";
import {
  respondWithError,
  verifyJoi,
  rIsUserForbidden,
  getClientAccount,
  rGetTokenData,
  IJWTAccount,
  IJWVerificationCode,
  getToken,
} from "../common";
import { logger } from "../../database/EventLog";
import { EDESTADDRREQ } from "constants";

const temporaryToken = randomBytes(64).toString("base64");

const spamProtector = new SpamProtector();

//Register
export async function registerUser(req: Request, res: Response) {
  logger.debug(`Registering...`, req.body);
  if (!req.headers.origin) respondWithError(res, 400, "Something went wrong with your request");
  const request = verifyJoi<IAccountRegisterRequest>(req, res, joi$registerUser);
  if (!request) return;
  if (profanity.exists(request.username)) return respondWithError(res, 404, "Bad username");

  try {
    const userUserName = await findUserByName(request.username);
    const userEmail = await findUserByEmail(request.email);

    if (userEmail || userUserName) {
      if (userEmail) return respondWithError(res, 404, "Email is already in use by someone");
      else return respondWithError(res, 404, "Username is already in use by someone");
    }
  } catch (error) {
    logger.error("Fetching user from database", error);
    return respondWithError(res, 500, "Internal server error");
  }

  if (!spamProtector.addIP(req.ip)) return respondWithError(res, 429, "To many requests");

  try {
    logger.debug(`Registering user`);
    const user = await registerUserInDatabase(request.username, request.email, request.password, req.ip);
    const tokenData: IJWVerificationCode = {
      id: user._id,
      exp: Date.now() + HOUR,
      type: VerificationType.Verificaiton,
    };
    const token = jwt.sign(tokenData, temporaryToken);
    const verificationURL = `${req.headers.origin}/account?v=${token}`;
    mailService
      .sendVerification(request.email, {
        id: user._id,
        ip: req.ip,
        username: user.username,
        verificationURL,
        reason: "Someone registered to our webpage",
      })
      .catch(err => {
        logger.error(`Unable to send email`, err);
      });
    const response: IResponse<string> = {
      success: "Email has been sent",
      message: "Email has been sent",
    };
    logger.debug(`User registered`, response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error(`Unable to register user`, error);
    return respondWithError(res, 500, "Internal server error");
  }
}

//Login
export async function loginUser(req: Request, res: Response) {
  logger.debug(`Login`, req.body);
  const request = verifyJoi<IAccountLoginRequest>(req, res, joi$loginUser);
  if (!request) return;

  const response: IAccountResponse = {};

  const user = await getUserByAccountOrEmail(request.usernameOrEmail);
  if (rIsUserForbidden(res, user)) return;

  logger.debug(`User found`, user.username);

  try {
    if (!spamProtector.addIP(req.ip)) return respondWithError(res, 429, "To many requests");
    const verified = await verifyPassword(request.password, user.password);
    if (!verified) return respondWithError(res, 400, "Incorrect password");
  } catch (error) {
    logger.error(error, "Verifying Password");
    return respondWithError(res, 500, "Internal server error");
  }

  const jwtTokenData: IJWTAccount = {
    id: user._id,
    exp: Date.now() + WEEK * 2,
  };
  const data = getClientAccount(user);
  const jwtToken = jwt.sign(jwtTokenData, PRIVATE_KEY);

  response.success = data;
  response.message = "User loggined";
  logger.debug(`User loggined`, response);
  res.header(TOKEN_HEADER, jwtToken);
  res.status(200).json(response);
  req.session.token = jwtTokenData;
}

//Check user
export async function checkUser(req: Request, res: Response) {
  logger.debug(`Checking user`, req.headers[TOKEN_HEADER]);
  const decoded: IJWTAccount = await rGetTokenData(req, res);
  if (!decoded) return;

  let user: IMongooseUserSchema;
  try {
    user = await getUserById(decoded.id);
  } catch (error) {
    logger.error("Cannot get user by id", error);
    return respondWithError(res, 500, "Internal server error");
  }
  if (rIsUserForbidden(res, user)) return;

  const response: IAccountResponse = {
    success: getClientAccount(user),
  };
  logger.debug(`User checked`, response);
  const usedToken = getToken(req);
  if (usedToken) {
    req.session.token = usedToken;
  }
  res.status(200).json(response);
  user.lastOnlineAt = Date.now();
  user.save().catch(err => logger.error(err, "Unable to save last online at"));
}

export async function changeDisplayedName(req: Request, res: Response) {
  logger.debug("Change displayed name", req.body);
  const request = verifyJoi<IAccountDisplayedNameRequest>(req, res, joi$displayedName);
  if (!request) return;
  const decoded: IJWTAccount = await rGetTokenData(req, res);
  if (!decoded) return;

  const user = await getUserById(decoded.id);
  if (rIsUserForbidden(res, user)) return;

  logger.debug("User found", user.username);
  const correctPassword = await verifyPassword(request.password, user.password);
  if (!correctPassword) return respondWithError(res, 400, "Incorrect password");
  if (user.displayedName.toLowerCase() === request.displayedName.toLowerCase())
    return respondWithError(res, 400, "You already have this displayed name");
  if (profanity.exists(request.displayedName)) return respondWithError(res, 400, "Bad username");
  const exist = await doesUserWithDisplayedNamesExist(request.displayedName);
  if (exist) return respondWithError(res, 400, "Someone already use this name");
  user.displayedName = request.displayedName;

  try {
    await user.save();
    const response: IAccountResponse = {
      success: getClientAccount(user),
      message: "Displayed name changed",
    };
    logger.debug("name changed", response);
    res.status(200).json(response);
    user.lastOnlineAt = Date.now();
    user.save().catch(err => logger.error(err, "Unable to save last online at"));
    return;
  } catch (error) {
    logger.error("Cannot change displayed name", error);
    return respondWithError(res, 500, "Internal server Error");
  }
}

export async function changePassword(req: Request, res: Response) {
  logger.debug("Change password", req.body);

  const request = verifyJoi<IAccountChangePasswordRequest>(req, res, joi$changePassword);
  if (!request) return;
  const decoded = (await rGetTokenData(req, res)) as IJWVerificationCode;
  if (!decoded) return;
  const response: IAccountResponse = {};

  const user = await getUserById(decoded.id);
  if (rIsUserForbidden(res, user)) return;
  logger.debug("User found", user.username);

  const correctPassword = await verifyPassword(request.oldPassword, user.password);
  if (!correctPassword) return respondWithError(res, 400, "Incorrect password");

  try {
    await changePasswordOnAccount(user, request.newPassword);
    response.success = getClientAccount(user);

    response.message = "Password has been changed successfully";
    logger.debug("Password changed", response);
    res.status(200).json(response);
    return;
  } catch (error) {
    return respondWithError(res, 500, "Internal server Error");
  }
}

// VERIFICATION SEND
export async function changeEmail(req: Request, res: Response) {
  logger.debug("Change email", req.body);
  if (!req.headers.origin) respondWithError(res, 400, "Something went wrong with your request");
  const request = verifyJoi<IAccountChangeEmailRequest>(req, res, joi$changeEmail);
  if (!request) return;
  const decoded: IJWTAccount = await rGetTokenData(req, res);
  if (!decoded) return;

  const user = await getUserById(decoded.id);
  if (rIsUserForbidden(res, user)) return;
  logger.debug("User found", user.username);

  try {
    const correctPassword = await verifyPassword(request.password, user.password);
    if (!correctPassword) return respondWithError(res, 400, "Incorrect password");

    const jwtTokenData: IJWVerificationCode = {
      id: user._id,
      exp: Date.now() + WEEK * 2,
      type: VerificationType.ChangeEmail,
      data: request.newEmail,
    };
    const jwtToken = jwt.sign(jwtTokenData, temporaryToken);
    const verificationURL = `${req.headers.origin}/account/?v=${jwtToken}`;
    await mailService
      .sendNewVerification(user.email, {
        id: user._id,
        ip: req.ip,
        username: user.username,
        verificationURL,
        reason: "Someone requested change email on our webpage",
      })
      .catch(err => logger.error(err, "Unable to send email"));

    const response: IAccountResponse = {
      success: getClientAccount(user),
      message: "Mail has been sent",
    };

    logger.debug("User email sent", response);
    return res.status(200).json(response);
  } catch (error) {
    logger.error("Change email", error);
    return respondWithError(res, 500, "Internal server Error");
  }
}

export async function resetPasswordLink(req: Request, res: Response) {
  logger.debug("Reset password link", req.body);
  if (!req.headers.origin) respondWithError(res, 400, "Something went wrong with your request");
  const request = verifyJoi<IAccountEmailRequest>(req, res, joi$email);
  if (!request) return;

  try {
    const user = await findUserByEmail(request.email);
    logger.debug("User found", user.username);
    const response: IResponse<string> = {
      success: "If user exist the email has been sent",
      message: "If user exist the email has been sent",
    };
    res.status(200).json(response);
    if (!user || user.banned) return;

    const jwtTokenData: IJWVerificationCode = {
      id: user._id,
      exp: Date.now() + HOUR,
      type: VerificationType.PasswordReset,
    };
    const jwtToken = jwt.sign(jwtTokenData, temporaryToken);

    const verificationURL = `${req.headers.origin}/account/?v=${jwtToken}`;

    mailService
      .sendNewPasswordReset(request.email, {
        id: user._id,
        ip: req.ip,
        username: user.username,
        verificationURL,
        reason: "Someone requested password reset on our webpage",
      })
      .catch(err => {
        logger.error("Unable to send email", err, verificationURL);
      });
  } catch (error) {
    logger.error("Unable to send verification code", error);
    return respondWithError(res, 500, "Internal server Error");
  }
}

export async function uploadImage(req: Request, res: Response) {
  logger.debug("User found", req.body);
  const request = verifyJoi<IAccountVerificationRequest>(req, res, joi$verification);
  if (!request) return;
  const decoded = await rGetTokenData(req, res);
  if (!decoded) return;

  if (req.files === null) return respondWithError(res, 400, "No files");

  const files = req.files.file;
  let file: fileUpload.UploadedFile;
  if (Array.isArray(files)) file = file[0];
  else file = files;

  if (!/.(jpg|png|gif|bmp)$/g.test(file.name)) return respondWithError(res, 400, "Unknown File format");

  try {
    const user = await getUserById(decoded.id);
    logger.debug("User found", user.username);
    if (rIsUserForbidden(res, user)) return;
    const correctPassword = await verifyPassword(request.password, user.password);
    if (!correctPassword) return respondWithError(res, 400, "Incorrect password");

    await changeAvatar(user, file.data);
    const response: IAccountResponse = {};
    response.success = getClientAccount(user);
    response.message = "Avatar changed";

    logger.debug("Image uploaded", response);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Upload image", error);
    return respondWithError(res, 500, "Internal server error");
  }
}

export async function deleteAccount(req: Request, res: Response) {
  logger.debug("delete account", req.body);
  const request = verifyJoi<IAccountDeleteAccountRequest>(req, res, joi$deleteAccount);
  if (!request) return;
  const decoded = await rGetTokenData(req, res);
  if (!decoded) return;

  const user = await getUserById(decoded.id);
  if (!user) respondWithError(res, 400, "user has already been removed from database");

  logger.debug("User found", user.username);

  const correctPassword = await verifyPassword(request.password, user.password);
  if (!correctPassword) return respondWithError(res, 400, "Incorrect password");
  if (user.banned) return respondWithError(res, 400, "Cannot delete banned account");
  if (user.flags.length !== 0) {
    return respondWithError(res, 400, "Your account has been flagged and it cannot be removed from database");
  }

  const email = user.email;
  const emailData: IMailAccountInfo = {
    id: user._id,
    ip: "",
    reason: "Requested by user",
    username: user.username,
    verificationURL: "",
  };

  user.remove();
  mailService.informAboutAccountDeletion(email, emailData).catch(err => logger.error(err, "Unable to send email"));
  const response: IResponse<string> = {
    success: "Account successfully deleted",
  };
  logger.debug("User deleted", response);
  res.status(200).json(response);
}

export async function checkOutTemporarilyToken(req: Request, res: Response) {
  const token = req.headers[TOKEN_HEADER];
  logger.debug("Checking token", token);
  const isTokenBlackListedResult = await isTokenBlackListed(token as string);
  if (isTokenBlackListedResult) return respondWithError(res, 400, "This token has already been used");
  const decoded = (await rGetTokenData(req, res, true)) as IJWVerificationCode;
  if (!decoded) return;
  const response: IResponse<VerificationType> = {
    success: decoded.type,
  };
  logger.debug("Token checked", response);
  res.status(200).json(response);
}

export async function temporarilyTokenAccountAltering(req: Request, res: Response) {
  logger.debug("Checking temporary token", req.headers[TOKEN_HEADER]);
  const response: IResponse<string> = {};
  const decoded = (await rGetTokenData(req, res, true)) as IJWVerificationCode;
  if (!decoded) return;
  const token = req.headers[TOKEN_HEADER];
  try {
    const isTokenBlackListedResult = await isTokenBlackListed(token as string);
    if (isTokenBlackListedResult) return respondWithError(res, 400, "This token has already been used");
    const user = await getUserById(decoded.id);
    if (rIsUserForbidden(res, user)) return;

    logger.debug("User found", user.username);

    switch (decoded.type) {
      case VerificationType.PasswordReset:
        response.success = "Password has been reset";
        response.message = "Password has been reset";
        const passwordData = verifyJoi<IAccountVerificationPassword>(req, res, joi$resetPassword);
        if (!passwordData) return;
        const verified = await verifyPassword(passwordData.password, user.password);
        if (verified) return respondWithError(res, 400, "Password cannot be the same as you current one");
        await changePasswordOnAccount(user, passwordData.password, false);
        break;

      case VerificationType.Verificaiton:
        response.success = "Account verified";
        response.message = `Welcome ${user.displayedName} your account has been verified`;
        break;
      case VerificationType.ChangeEmail:
        if (!decoded.data) return respondWithError(res, 400, "Invalid Token");
        response.success = "Account verified";
        response.message = `Alright ${user.displayedName} your email has been changed`;
        await changeEmailOnAccount(user, decoded.data, false);
        break;

      default:
        return respondWithError(res, 400, "Bad token");
    }
    await addTokenToBlackList(token as string, decoded.exp);
    user.verified = true;
    user.lastOnlineAt = Date.now();
    await user.save();
    logger.debug("Token verified", response);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Verification code failed", error);
    return respondWithError(res, 500, "Internal server error");
  }
}

//TODO implement better?
export async function logOutUser(req: Request, res: Response) {
  logger.debug(`Logout`, req.body);
  req.session.destroy(err => {
    logger.error("Cannot destroy session", err);
  });

  const response: IResponse<string> = {};
  response.success = "Info";
  response.message = "User logged Out";
  logger.debug(`User logged Out`, response);
  res.status(200).json(response);
}
