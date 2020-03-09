import { Request, Response } from 'express';
import ipInfo from 'ipInfo';
import { IIPResponse } from '../../shared/ApiRequestsResponds';

export function apiIp(req: Request, res: Response) {
  const response: IIPResponse = {};
  const ip = req.ip.match(/\d.*/g);
  if (!ip) {
    response.error = 'Unable to get IP info';
    return res.status(200).json(response);
  }
  if (ip[0] === '1') {
    response.success = {
      ip: 'localhost'
    };
    return res.status(200).json(response);
  }

  ipInfo(ip[0], (err, cLoc) => {
    if (err) {
      response.error = 'Internal server error';
      return res.status(500).json(response);
    }
    if (cLoc.error) {
      response.error = cLoc.error.title ? cLoc.error.title : 'Something went wrong';
      if (cLoc.error.message) response.details = cLoc.error.message;
      return res.status(200).json(response);
    } else {
      response.success = cLoc;
      return res.status(200).json(response);
    }
  });
}
