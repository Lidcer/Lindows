import { Request, Response } from 'express';
import * as Joi from '@hapi/joi';
import { userAccount } from '../database/shemas';

interface IUserResolve {
  error?: string;
}

export function userGet(req: Request, res: Response) {
  const userId = req.params.userId;
  const jsonRep: IUserResolve = {};

  if (!userId) {
    jsonRep.error = 'Missing ID';
    return res.json(jsonRep);

    // checks if users id contains numbers only
  } else if (!/^\d+$/.test(userId)) {
    jsonRep.error = 'ID is not valid';
    return res.json(jsonRep);
  }

  const obj = userAccount.validate(req.body);

  if (obj.error) {
    return res.json(obj);
  }
  return res.json({ e: 'e' });
}

export function userPost(req: Request, res: Response) {
  console.log(req.body);

  return res.json({ e: 'req' });
}

