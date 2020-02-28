import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { registerUserInDatabase, findUserByName, findUserByEmail } from '../database/Users';
import { PRIVATE_KEY } from '../config';
import { registerUserJoi, loginUserJoi } from '../../shared/joi';
import { IAccountRegisterRequest, IAccountLoginRequest } from '../../shared/ApiRequests';
import { verifyPassword } from '../database/passwordHasher';
import { sendMail } from '../mail';
import { generateVerificationCode, addVerificationCodeToDatabase, verifyCode } from '../database/Verify';
import { verificationApi } from './api-router';

interface IUserResolve {
  error?: string;
}

export async function registerUser(req: Request, res: Response) {
  const accountRequest: IAccountRegisterRequest = req.body;

  const obj = registerUserJoi.validate(accountRequest);
  if (obj.error) {
    return res.status(400).json(obj);
  }

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
    await addVerificationCodeToDatabase(result._id, code, 'mail-verification');
    const verificationUrl = `${req.host}${verificationApi}${code}`;

    const text = `Please verify your account on: ${verificationUrl}`;
    const html = `Please verify your account on: <a>${verificationUrl}</a>`;

    sendMail(accountRequest.email, 'Verification code', text, html).catch(console.error);

    const jwtToken = jwt.sign(result, PRIVATE_KEY);
    res.header('x-auth-token', jwtToken);
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

  const userUserName = await findUserByName(accountLoginRequest.username);
  const userEmail = await findUserByEmail(accountLoginRequest.email);

  const user = userUserName ? userUserName : userEmail;
  if (!user) {
    if (userEmail || userUserName) return res.status(400).json({ error: 'User does not exist' });
  }

  //TODO: Add spam protection
  try {
    const verified = verifyPassword(accountLoginRequest.password, user.password);
    if (!verified) {
      return res.status(400).json({ error: 'WrongPassword' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  const jwtToken = jwt.sign(user, PRIVATE_KEY);
  res.header('x-auth-token', jwtToken);
  res.json({ status: 'Success' });
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

export function resetPassword(req: Request, res: Response) {
  return res.status(501);
}

export function changeEmail(req: Request, res: Response) {
  return res.status(501);
}

export function userGet(req: Request, res: Response) {
  const userId = req.params.userId;
  const jsonRep: IUserResolve = {};

  if (!userId) {
    jsonRep.error = 'Missing ID';
    return res.status(400).json(jsonRep);
  } else if (!/^\d+$/.test(userId)) {
    jsonRep.error = 'ID is not valid';
    return res.status(400).json(jsonRep);
  }

  return res.json({ e: 'e' });
}
