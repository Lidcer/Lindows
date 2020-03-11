import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { TOKEN_HEADER, WEEK, HOUR } from '../../shared/constants';

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
} from '../database/Users';
import { PRIVATE_KEY } from '../config';
import { registerUserJoi, loginUserJoi, changePasswordJoi, changeEmailJoi, emailJoi } from '../../shared/joi';
import {
  IAccountRegisterRequest,
  IAccountLoginRequest,
  IAccountChangePasswordRequest,
  IAccountChangeEmailRequest,
  IAccountResponse,
  IAccount,
  IResponse,
  IAccountResetPasswordRequest,
} from '../../shared/ApiRequestsResponds';
import { verifyPassword } from '../database/passwordHasher';

import { generateVerificationCode, addVerificationCodeToDatabase, verifyCode } from '../database/Verify';
import fileUpload = require('express-fileupload');
import { logError } from './Error';

import { mailService } from '../main';

interface IJWTAccount {
  id: string;
  exp: number;
}

const registerdIps = new Map<string, number>();

function removeCountFromRegistredIp(ip: string) {
  setTimeout(() => {
    let ipCount = registerdIps.get(ip);
    if (ipCount) {
      if (ipCount === 0) registerdIps.delete(ip);
    } else registerdIps.set(ip, --ipCount);
  }, HOUR);
}

//register
export async function registerUser(req: Request, res: Response) {
  const response: IResponse<string> = {};
  let ip = registerdIps.get(req.ip);
  if (ip) {
    registerdIps.set(req.ip, 0);
    removeCountFromRegistredIp(req.ip);
  } else {
    registerdIps.set(req.ip, ++ip);
    removeCountFromRegistredIp(req.ip);
    if (ip > 3) {
      response.error = 'To many requests';
      return res.status(429).json(response);
    }
  }

  const accountRequest: IAccountRegisterRequest = req.body;

  const joiResult = registerUserJoi.validate(accountRequest);
  if (joiResult.error) {
    response.error = joiResult.error.message;
    response.details = joiResult.error;
    return res.status(400).json(response);
  }

  try {
    const userUserName = await findUserByName(accountRequest.username);
    const userEmail = await findUserByEmail(accountRequest.email);

    if (userEmail || userUserName) {
      if (userEmail) response.error = 'Email is already used by someone';
      else response.error = 'Username is already taken';
      return res.status(400).json(response);
    }
  } catch (error) {
    logError(error, 'Fetching user from database');
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }

  try {
    const user = await registerUserInDatabase(
      accountRequest.username,
      accountRequest.email,
      accountRequest.password,
      req.ip,
    );
    const code = generateVerificationCode();
    await addVerificationCodeToDatabase(user._id, code, 'verify-account');
    mailService.sendVerification(accountRequest.email, 'Verification code').catch(err => {
      logError(err, 'Unable to send email');
    });

    response.success = 'Email has been sent';
    res.status(200).json(response);
    return;
  } catch (error) {
    logError(error, 'Registering user');
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
}

//Login
export async function loginUser(req: Request, res: Response) {
  const response: IAccountResponse = {};
  const accountLoginRequest: IAccountLoginRequest = req.body;

  const joiResult = loginUserJoi.validate(accountLoginRequest);
  if (joiResult.error) {
    response.error = joiResult.error.message;
    response.details = joiResult.error;
    return res.status(400).json(response);
  }

  const user = await getUserByAccountOrEmail(accountLoginRequest.username, accountLoginRequest.email);
  if (!user) {
    response.error = 'User does not exist';
    return res.status(400).json(response);
  }

  //TODO: Add spam protection
  try {
    const verified = await verifyPassword(accountLoginRequest.password, user.password);
    if (!verified) {
      response.error = 'Incorrect password';
      return res.status(400).json(response);
    }
  } catch (error) {
    response.error = 'Internal server error';
    logError(error, 'Verifying Password');
    return res.status(500).json(response);
  }

  if (!user.verified) {
    response.error = 'user has not verified email';
    return res.status(400).json(response);
  }
  const jwtTokenData: IJWTAccount = {
    id: user._id,
    exp: WEEK * 2,
  };
  const data: IAccount = {
    username: user.username,
    id: user._id,
    verified: user.verified,
    avatar: getUserImage(user),
  };

  const jwtToken = jwt.sign(jwtTokenData, PRIVATE_KEY);

  response.success = data;

  res.header(TOKEN_HEADER, jwtToken);
  res.status(200).json(response);
}

//Check user
export async function checkUser(req: Request, res: Response) {
  const response: IAccountResponse = {};
  const decoded: IJWTAccount = getTokenData(req, res);
  if (!decoded) return;

  let user: IMongooseUserSchema;
  try {
    user = await getUserById(decoded.id);
  } catch (error) {
    logError(error, 'Cannot get user by id');
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }

  if (!user) {
    response.error = 'Account has been removed from database';
    return res.status(400).json(response);
  }
  if (user.banned) {
    response.error = 'Account has been banned';
    return res.status(400).json(response);
  }
  if (user.compromised) {
    response.error = 'Account has been compromised';
    return res.status(400).json(response);
  }

  const data: IAccount = {
    id: user.id,
    username: user.username,
    verified: user.verified,
    avatar: getUserImage(user),
  };
  response.success = data;

  res.status(200).json(response);
  user.lastOnlineAt = Date.now();
  await user.save().catch(err => logError(err, 'Unable to save last online at'));
}

export async function verifyUser(req: Request, res: Response) {
  const response: IAccountResponse = {};
  const verificationCode = req.params['verificationCodeId'];
  console.log(verificationCode);
  try {
    const user = await verifyCode(verificationCode);

    const data: IAccount = {
      id: user.id,
      username: user.username,
      verified: user.verified,
      avatar: getUserImage(user),
    };
    response.success = data;
    return res.status(200).json(response);
  } catch (error) {
    response.error = 'Invalid code';
    return res.status(400).json(response);
  }
}

export async function changePassword(req: Request, res: Response) {
  const response: IAccountResponse = {};
  const decoded: IJWTAccount = getTokenData(req, res);
  if (!decoded) return;

  const iAccountChangePasswordRequest: IAccountChangePasswordRequest = req.body;
  const joiResult = changePasswordJoi.validate(iAccountChangePasswordRequest);

  if (joiResult.error) {
    response.error = joiResult.error.message;
    return res.status(400).json(response);
  }

  const user = await getUserById(decoded.id);
  if (!user) {
    response.error = 'User has been delete from database';
    return res.status(400).json(response);
  }
  const correctPassword = await verifyPassword(iAccountChangePasswordRequest.oldPassword, user.password);
  if (!correctPassword) {
    response.error = 'Incorrect password';
    return res.status(400).json(response);
  }

  try {
    await changePasswordOnAccount(user, iAccountChangePasswordRequest.newPassword);
    response.success = {
      id: user.id,
      username: user.username,
      verified: user.verified,
      avatar: getUserImage(user),
    };

    response.message = 'Password has been changed successfully';
    return res.status(200).json(response);
  } catch (error) {
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
}

export async function resetPassword(req: Request, res: Response) {
  const response: IResponse<string> = {};
  const request: IAccountResetPasswordRequest = req.body;
  const joiResult = emailJoi.validate(request);
  if (joiResult.error) {
    response.error = joiResult.error.message;
    response.details = joiResult.error;
    return res.status(400).json(response);
  }

  try {
    const user = await findUserByEmail(request.email);
    if (!user) {
      response.error = 'User under this email does not exist';
      return res.status(400).json(response);
    }
    const code = generateVerificationCode();
    await addVerificationCodeToDatabase(user._id, code, 'password-change');
    const verificationUrl = `${req.host}/account/?pc=${code}`;
    await mailService.sendNewPasswordReset(user.email, verificationUrl);
    res.status(200).json({ success: 'Please confirm password change on email' });
  } catch (error) {
    logError(error, 'Unable to send verification code');
    response.error = 'Internal server error';
    res.status(200).json(response);
  }

  res.status(200).json({ success: 'If email' });
}

//TODO: do proper method
export async function changeEmail(req: Request, res: Response) {
  const response: IAccountResponse = {};
  const decoded: IJWTAccount = getTokenData(req, res);
  if (!decoded) return;

  const iAccountChangeEmailRequest: IAccountChangeEmailRequest = req.body;
  const joiResult = changeEmailJoi.validate(iAccountChangeEmailRequest);

  if (joiResult.error) {
    response.error = joiResult.error.message;
    return res.status(400).json(response);
  }

  const user = await getUserById(decoded.id);
  if (!user) {
    response.error = 'User has been removed from database';
    return res.status(400).json(response);
  }

  try {
    const code = generateVerificationCode();
    await addVerificationCodeToDatabase(user._id, code, 'email-change', iAccountChangeEmailRequest.email);

    const verificationUrl = `${req.host}/account/?r=${code}`;
    await mailService.sendNewVerification(iAccountChangeEmailRequest.email, verificationUrl);

    response.success = {
      id: user.id,
      username: user.username,
      verified: user.verified,
      avatar: getUserImage(user),
    };

    return res.status(200).json(response);
  } catch (error) {
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
}

export async function uploadImage(req: Request, res: Response) {
  if (req.files === null) return res.status(400).json({ error: 'No files' });
  const decoded = getTokenData(req, res);
  if (!decoded) return;

  const files = req.files.file;
  let file: fileUpload.UploadedFile;
  if (Array.isArray(files)) file = file[0];
  else file = files;

  if (!/.(jpg|png|gif|bmp)$/g.test(file.name)) return res.status(400).json({ error: 'Unknown File format' });

  try {
    const user = await getUserById(decoded.id);
    await changeAvatar(user, file.data);
    res.status(200).json({ avatar: getUserImage(user) });
  } catch (error) {
    return res.status(400).json({ error: 'Internal server error' });
  }
}

export function deleteAccount(req: Request, res: Response) {
  return res.status(501);
}

function getTokenData(req: Request, res: Response): IJWTAccount | null {
  const response: IAccountResponse = {};
  if (!req.headers[TOKEN_HEADER]) {
    response.error = 'Missing token';
    res.status(400).json(response);
    return null;
  }
  const token = req.headers[TOKEN_HEADER];
  if (!token) {
    response.error = 'Missing token';
    res.status(400).json(response);
    return null;
  }
  if (typeof token !== 'string') {
    response.error = 'Invalid token provided';
    res.status(400).json(response);
    return null;
  }
  const data = jwt.decode(token) as IJWTAccount;
  if (data.id && data.exp) {
    if (typeof data.exp !== 'number') {
      response.error = 'Invalid token';
      res.status(400).json(response);
      return null;
    }
    if (data.exp > Date.now()) {
      response.error = 'Token has expired';
      res.status(400).json(response);
      return null;
    }
    return data;
  }
  response.error = 'Could not authenticate user';
  res.status(400).json(response);
  return null;
}
