import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { TOKEN_HEADER } from '../../shared/constants';

import {
  registerUserInDatabase,
  findUserByName,
  findUserByEmail,
  getUserByAccountOrEmail,
  changePasswordOnAccount,
  IAccountResponse,
  getUserById,
  IMongooseUserSchema,
  changeAvatar,
  getUserImage,
} from '../database/Users';
import { PRIVATE_KEY } from '../config';
import { registerUserJoi, loginUserJoi, changePasswordJoi, changeEmailJoi } from '../../shared/joi';
import {
  IAccountRegisterRequest,
  IAccountLoginRequest,
  IAccountChangePasswordRequest,
  IAccountChangeEmailRequest,
} from '../../shared/ApiRequests';
import { verifyPassword } from '../database/passwordHasher';
import { sendMail } from '../mail';
import { generateVerificationCode, addVerificationCodeToDatabase, verifyCode } from '../database/Verify';
import { verificationApi } from './api-router';
import fileUpload = require('express-fileupload');

export async function registerUser(req: Request, res: Response) {
  const accountRequest: IAccountRegisterRequest = req.body;

  const joiResult = registerUserJoi.validate(accountRequest);
  if (joiResult.error) return res.status(400).json(joiResult);

  try {
    const userUserName = await findUserByName(accountRequest.username);
    const userEmail = await findUserByEmail(accountRequest.email);

    if (userEmail || userUserName) return res.status(400).json({ error: 'User already exist' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  try {
    const result = await registerUserInDatabase(
      accountRequest.username,
      accountRequest.email,
      accountRequest.password,
      req.ip,
    );
    const code = generateVerificationCode();
    await addVerificationCodeToDatabase(result._id, code, 'verify-account');
    const verificationUrl = `${req.host}${verificationApi}${code}`;

    const text = `Please verify your account on: ${verificationUrl}`;
    const html = `Please verify your account on: <a>${verificationUrl}</a>`;

    sendMail(accountRequest.email, 'Verification code', text, html).catch(console.error);

    const jwtToken = jwt.sign(result, PRIVATE_KEY);
    res.header(TOKEN_HEADER, jwtToken);
    res.json({ status: 'Success' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function loginUser(req: Request, res: Response) {
  const accountLoginRequest: IAccountLoginRequest = req.body;

  const obj = loginUserJoi.validate(accountLoginRequest);
  if (obj.error) {
    return res.status(400).json(obj);
  }

  const user = await getUserByAccountOrEmail(accountLoginRequest.username, accountLoginRequest.email);
  if (!user) return res.status(400).json({ error: 'User does not exist' });

  //TODO: Add spam protection
  try {
    const verified = await verifyPassword(accountLoginRequest.password, user.password);
    if (!verified) {
      return res.status(400).json({ error: 'WrongPassword' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  const result: IAccountResponse = {
    _id: user._id,
    permissions: user.permissions,
  };

  const jwtToken = jwt.sign(result, PRIVATE_KEY);

  res.header(TOKEN_HEADER, jwtToken);
  res.json({ status: 'Success', username: user.username, email: user.email });
}

export async function checkUser(req: Request, res: Response) {
  const decoded = getTokenData(req, res);
  if (!decoded) return;

  let user: IMongooseUserSchema;
  try {
    user = await getUserById(decoded._id);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!user) return res.status(400).json({ error: 'Account has been removed from database' });
  if (user.banned) return res.status(400).json({ error: 'Account has been banned' });
  if (user.compromised) return res.status(400).json({ error: 'Account has been compromised' });

  const response = { status: 'Success', username: user.username, email: user.email, avatar: null };
  if (user.avatar) response.avatar = getUserImage(user);

  res.status(200).json(response);
  user.lastOnlineAt = Date.now();
}

export async function verifyUser(req: Request, res: Response) {
  const verificationCode = req.params['verificationCodeId'];
  try {
    await verifyCode(verificationCode);
  } catch (error) {
    return res.status(400);
  }
  res.status(400).send('verified ok :ok hand:');
}

export function deleteAccount(req: Request, res: Response) {
  return res.status(501);
}

export async function changePassword(req: Request, res: Response) {
  const accountChangePasswordRequest: IAccountChangePasswordRequest = req.body;

  const joiResult = changePasswordJoi.validate(accountChangePasswordRequest);
  if (joiResult.error) return res.status(400).json(joiResult);

  const user = await getUserByAccountOrEmail(accountChangePasswordRequest.username, accountChangePasswordRequest.email);
  if (!user) return res.status(400).json({ error: 'User does not exist' });

  try {
    const code = generateVerificationCode();
    await addVerificationCodeToDatabase(user._id, code, 'password-change', accountChangePasswordRequest.newPassword);

    const verificationUrl = `${req.host}${verificationApi}${code}`;
    const text = `Please verify your new password on: ${verificationUrl}`;
    const html = `Please verify your new password on: <a>${verificationUrl}</a>`;

    await sendMail(accountChangePasswordRequest.email, 'Verification code', text, html);

    await changePasswordOnAccount(user, accountChangePasswordRequest.newPassword);
    return res.status(200).json({ status: 'Success' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changeEmail(req: Request, res: Response) {
  const accountChangeEmailRequest: IAccountChangeEmailRequest = req.body;

  const joiResult = changeEmailJoi.validate(accountChangeEmailRequest);
  if (joiResult.error) return res.status(400).json(joiResult);

  const user = await getUserByAccountOrEmail(accountChangeEmailRequest.username, accountChangeEmailRequest.email);
  if (!user) return res.status(400).json({ error: 'User does not exist' });

  try {
    const code = generateVerificationCode();
    await addVerificationCodeToDatabase(user._id, code, 'email-change', accountChangeEmailRequest.newEmail);

    const verificationUrl = `${req.host}${verificationApi}${code}`;
    const text = `Please verify your new email on: ${verificationUrl}`;
    const html = `Please verify your new email on: <a>${verificationUrl}</a>`;

    await sendMail(accountChangeEmailRequest.newEmail, 'Verification code', text, html);

    return res.status(200).json({ status: 'Email sent' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
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
    const user = await getUserById(decoded._id);
    await changeAvatar(user, file.data);
    res.status(200).json({ avatar: getUserImage(user) });
  } catch (error) {
    return res.status(400).json({ error: 'Internal server error' });
  }
}

export function userGet(req: Request, res: Response) {
  // const userId = req.params.userId;
  // const jsonRep: IUser = {};

  // if (!userId) {
  //   jsonRep.error = 'Missing ID';
  //   return res.status(400).json(jsonRep);
  // } else if (!/^\d+$/.test(userId)) {
  //   jsonRep.error = 'ID is not valid';
  //   return res.status(400).json(jsonRep);
  // }

  return res.json({ e: 'e' });
}

function getTokenData(req: Request, res: Response): IAccountResponse | null {
  if (!req.headers[TOKEN_HEADER]) {
    res.status(400).json({ error: 'Missing token' });
    return null;
  }
  const token = req.headers[TOKEN_HEADER];
  if (typeof token !== 'string') {
    res.status(400);
    return null;
  }
  if (!token) {
    res.status(400);
    return null;
  }
  const data = jwt.decode(token) as IAccountResponse;
  if (data._id && data.permissions) return data;

  res.status(400);
  return null;
}
