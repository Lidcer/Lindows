import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as Joi from '@hapi/joi';
import { userAccount, createUser } from '../database/Users';
import { IAccountRequest } from '../../shared/ApiRequests';
import { PRIVATE_KEY } from '../config';

interface IUserResolve {
  error?: string;
}

export async function userPost(req: Request, res: Response) {
  const accountRequest = req.body;

  const obj = userAccount.validate(accountRequest);
  if (obj.error) {
    return res.json(obj);
  }

  try {
    const result = await createUser(accountRequest.username, accountRequest.email, accountRequest.password, req.ip);

    const jwtToken = jwt.sign(result, PRIVATE_KEY);
    res.header('x-auth-token', jwtToken);
    res.json({ status: 'Success' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
