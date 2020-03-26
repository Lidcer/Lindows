import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { TOKEN_HEADER, WEEK, HOUR } from '../../../shared/constants';
import { profanity } from '@2toad/profanity';

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
} from './users-database';
import { PRIVATE_KEY } from '../../config';
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
} from './users-joies';
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
} from '../../../shared/ApiUsersRequestsResponds';
import { verifyPassword } from '../../database/passwordHasher';
import { SpamProtector } from '../SpamProtector';
import fileUpload = require('express-fileupload');
import { logError } from '../Error';
import { randomBytes } from 'crypto';
import { mailService } from '../../main';
import { isTokenBlackListed, addTokenToBlackList } from '../../database/tokensBlacklist';
import { IMailAccountInfo } from '../mail';
import {
  respondWithError,
  verifyJoi,
  rIsUserForbidden,
  getClientAccount,
  rGetTokenData,
  IJWTAccount,
  IJWVerificationCode,
} from '../common';

const temporaryToken = randomBytes(64).toString('base64');

const spamProtector = new SpamProtector();

//Register
export async function registerUser(req: Request, res: Response) {
  if (!req.headers.origin) respondWithError(res, 400, 'Something went wrong with your request');
  const request = verifyJoi<IAccountRegisterRequest>(req, res, joi$registerUser);
  if (!request) return;
  if (profanity.exists(request.username)) return respondWithError(res, 404, 'Bad username');

  try {
    const userUserName = await findUserByName(request.username);
    const userEmail = await findUserByEmail(request.email);

    if (userEmail || userUserName) {
      if (userEmail) return respondWithError(res, 404, 'Email is already in use by someone');
      else return respondWithError(res, 404, 'Username is already in use by someone');
    }
  } catch (error) {
    logError(error, 'Fetching user from database');
    return respondWithError(res, 500, 'Internal server error');
  }

  if (!spamProtector.addIP(req.ip)) return respondWithError(res, 429, 'To many requests');

  try {
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
        reason: 'Someone registered to our webpage',
      })
      .catch(err => {
        logError(err, 'Unable to send email');
      });
    const response: IResponse<string> = {
      success: 'Email has been sent',
      message: 'Email has been sent',
    };
    return res.status(200).json(response);
  } catch (error) {
    logError(error, 'Registering user');
    return respondWithError(res, 500, 'Internal server error');
  }
}

//Login
export async function loginUser(req: Request, res: Response) {
  const request = verifyJoi<IAccountLoginRequest>(req, res, joi$loginUser);
  if (!request) return;

  const response: IAccountResponse = {};

  const user = await getUserByAccountOrEmail(request.usernameOrEmail);
  if (rIsUserForbidden(res, user)) return;

  try {
    if (!spamProtector.addIP(req.ip)) return respondWithError(res, 429, 'To many requests');
    const verified = await verifyPassword(request.password, user.password);
    if (!verified) return respondWithError(res, 400, 'Incorrect password');
  } catch (error) {
    logError(error, 'Verifying Password');
    return respondWithError(res, 500, 'Internal server error');
  }

  const jwtTokenData: IJWTAccount = {
    id: user._id,
    exp: Date.now() + WEEK * 2,
  };
  const data = getClientAccount(user);
  const jwtToken = jwt.sign(jwtTokenData, PRIVATE_KEY);

  response.success = data;
  response.message = 'User loggined';
  res.header(TOKEN_HEADER, jwtToken);
  res.status(200).json(response);
}

//Check user
export async function checkUser(req: Request, res: Response) {
  const decoded: IJWTAccount = rGetTokenData(req, res);
  if (!decoded) return;

  let user: IMongooseUserSchema;
  try {
    user = await getUserById(decoded.id);
  } catch (error) {
    logError(error, 'Cannot get user by id');
    return respondWithError(res, 500, 'Internal server error');
  }
  if (rIsUserForbidden(res, user)) return;

  const response: IAccountResponse = {
    success: getClientAccount(user),
  };
  res.status(200).json(response);
  user.lastOnlineAt = Date.now();
  user.save().catch(err => logError(err, 'Unable to save last online at'));
  return;
}

export async function changeDisplayedName(req: Request, res: Response) {
  const request = verifyJoi<IAccountDisplayedNameRequest>(req, res, joi$displayedName);
  if (!request) return;
  const decoded: IJWTAccount = rGetTokenData(req, res);
  if (!decoded) return;

  const user = await getUserById(decoded.id);
  if (rIsUserForbidden(res, user)) return;

  const correctPassword = await verifyPassword(request.password, user.password);
  if (!correctPassword) return respondWithError(res, 400, 'Incorrect password');
  if (user.displayedName.toLowerCase() === request.displayedName.toLowerCase())
    return respondWithError(res, 400, 'You already have this displayed name');
  if (profanity.exists(request.displayedName)) return respondWithError(res, 400, 'Bad username');
  const exist = await doesUserWithDisplayedNamesExist(request.displayedName);
  if (exist) return respondWithError(res, 400, 'Someone already use this name');
  user.displayedName = request.displayedName;

  try {
    await user.save();
    const response: IAccountResponse = {
      success: getClientAccount(user),
      message: 'Displayed name changed',
    };
    res.status(200).json(response);
    user.lastOnlineAt = Date.now();
    user.save().catch(err => logError(err, 'Unable to save last online at'));
    return;
  } catch (error) {
    logError(error, 'display name change');
    return respondWithError(res, 500, 'Internal server Error');
  }
}

export async function changePassword(req: Request, res: Response) {
  const request = verifyJoi<IAccountChangePasswordRequest>(req, res, joi$changePassword);
  if (!request) return;
  const decoded = rGetTokenData(req, res) as IJWVerificationCode;
  if (!decoded) return;
  const response: IAccountResponse = {};

  const user = await getUserById(decoded.id);
  if (rIsUserForbidden(res, user)) return;

  const correctPassword = await verifyPassword(request.oldPassword, user.password);
  if (!correctPassword) return respondWithError(res, 400, 'Incorrect password');

  try {
    await changePasswordOnAccount(user, request.newPassword);
    response.success = getClientAccount(user);

    response.message = 'Password has been changed successfully';
    res.status(200).json(response);
    return;
  } catch (error) {
    return respondWithError(res, 500, 'Internal server Error');
  }
}

// VERIFICATION SEND
export async function changeEmail(req: Request, res: Response) {
  if (!req.headers.origin) respondWithError(res, 400, 'Something went wrong with your request');
  const request = verifyJoi<IAccountChangeEmailRequest>(req, res, joi$changeEmail);
  if (!request) return;
  const decoded: IJWTAccount = rGetTokenData(req, res);
  if (!decoded) return;

  const user = await getUserById(decoded.id);
  if (rIsUserForbidden(res, user)) return;

  try {
    const correctPassword = await verifyPassword(request.password, user.password);
    if (!correctPassword) return respondWithError(res, 400, 'Incorrect password');

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
        reason: 'Someone requested change email on our webpage',
      })
      .catch(err => logError(err, 'Unable to send email'));

    const response: IAccountResponse = {
      success: getClientAccount(user),
      message: 'Mail has been sent',
    };

    return res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, 'Internal server Error');
  }
}

export async function resetPasswordLink(req: Request, res: Response) {
  if (!req.headers.origin) respondWithError(res, 400, 'Something went wrong with your request');
  const request = verifyJoi<IAccountEmailRequest>(req, res, joi$email);
  if (!request) return;

  try {
    const user = await findUserByEmail(request.email);
    const response: IResponse<string> = {
      success: 'If user exist the email has been sent',
      message: 'If user exist the email has been sent',
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
        reason: 'Someone requested password reset on our webpage',
      })
      .catch(err => {
        logError(err, 'Unable to send email');
      });
  } catch (error) {
    logError(error, 'Unable to send verification code');
    return respondWithError(res, 500, 'Internal server Error');
  }
}

export async function uploadImage(req: Request, res: Response) {
  const request = verifyJoi<IAccountVerificationRequest>(req, res, joi$verification);
  if (!request) return;
  const decoded = rGetTokenData(req, res);
  if (!decoded) return;

  if (req.files === null) return respondWithError(res, 400, 'No files');

  const files = req.files.file;
  let file: fileUpload.UploadedFile;
  if (Array.isArray(files)) file = file[0];
  else file = files;

  if (!/.(jpg|png|gif|bmp)$/g.test(file.name)) return respondWithError(res, 400, 'Unknown File format');

  try {
    const user = await getUserById(decoded.id);
    if (rIsUserForbidden(res, user)) return;
    const correctPassword = await verifyPassword(request.password, user.password);
    if (!correctPassword) return respondWithError(res, 400, 'Incorrect password');

    await changeAvatar(user, file.data);
    const response: IAccountResponse = {};
    response.success = getClientAccount(user);
    response.message = 'Avatar changed';

    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, 'Internal server error');
  }
}

export async function deleteAccount(req: Request, res: Response) {
  const request = verifyJoi<IAccountDeleteAccountRequest>(req, res, joi$deleteAccount);
  if (!request) return;
  const decoded = rGetTokenData(req, res);
  if (!decoded) return;

  const user = await getUserById(decoded.id);
  if (!user) respondWithError(res, 400, 'user has already been removed from database');

  const correctPassword = await verifyPassword(request.password, user.password);
  if (!correctPassword) return respondWithError(res, 400, 'Incorrect password');
  if (user.banned) return respondWithError(res, 400, 'Cannot delete banned account');
  if (user.flags.length !== 0)
    return respondWithError(res, 400, 'Your account has been flagged and it cannot be removed from database');

  const email = user.email;
  const emailData: IMailAccountInfo = {
    id: user._id,
    ip: '',
    reason: 'Requested by user',
    username: user.username,
    verificationURL: '',
  };

  user.remove();
  mailService.informAboutAccountDeletion(email, emailData).catch(err => logError(err, 'Unable to send email'));
  const response: IResponse<string> = {
    success: 'Account successfully deleted',
  };
  res.status(200).json(response);
}

export async function checkOutTemporarilyToken(req: Request, res: Response) {
  const token = req.headers[TOKEN_HEADER];
  const isTokenBlackListedResult = await isTokenBlackListed(token as string);
  if (isTokenBlackListedResult) return respondWithError(res, 400, 'This token has already been used');
  const decoded = rGetTokenData(req, res, true) as IJWVerificationCode;
  if (!decoded) return;
  const response: IResponse<VerificationType> = {
    success: decoded.type,
  };
  res.status(200).json(response);
}

export async function temporarilyTokenAccountAltering(req: Request, res: Response) {
  const response: IResponse<string> = {};
  const decoded = rGetTokenData(req, res, true) as IJWVerificationCode;
  if (!decoded) return;
  const token = req.headers[TOKEN_HEADER];
  try {
    const isTokenBlackListedResult = await isTokenBlackListed(token as string);
    if (isTokenBlackListedResult) return respondWithError(res, 400, 'This token has already been used');
    const user = await getUserById(decoded.id);
    if (rIsUserForbidden(res, user)) return;

    switch (decoded.type) {
      case VerificationType.PasswordReset:
        response.success = 'Password has been reset';
        response.message = 'Password has been reset';
        const passwordData = verifyJoi<IAccountVerificationPassword>(req, res, joi$resetPassword);
        if (!passwordData) return;
        const verified = await verifyPassword(passwordData.password, user.password);
        if (verified) return respondWithError(res, 400, 'Password cannot be the same as you current one');
        await changePasswordOnAccount(user, passwordData.password, false);
        break;

      case VerificationType.Verificaiton:
        response.success = 'Account verified';
        response.message = `Welcome ${user.displayedName} your account has been verified`;
        break;
      case VerificationType.ChangeEmail:
        if (!decoded.data) return respondWithError(res, 400, 'Invalid Token');
        response.success = 'Account verified';
        response.message = `Alright ${user.displayedName} your email has been changed`;
        console.log(decoded.data);
        await changeEmailOnAccount(user, decoded.data, false);
        break;

      default:
        return respondWithError(res, 400, 'Bad token');
    }
    await addTokenToBlackList(token as string, decoded.exp);
    user.verified = true;
    user.lastOnlineAt = Date.now();
    await user.save();
    res.status(200).json(response);
  } catch (error) {
    logError(error, 'Verification code');
    return respondWithError(res, 500, 'Internal server error');
  }
}
