import bodyParser from 'body-parser';
import * as fileUpload from 'express-fileupload';
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  deleteAccount,
  changeEmail,
  verifyUser,
  changePassword,
  checkUser,
  uploadImage,
  resetPassword,
} from './apiUsers';
import { imagesPath } from '../database/Users';
import { apiIp } from './apiIP';

export const verificationApi = '/api/v1/users/verify/';
export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  router.use(bodyParser.json());
  router.use(fileUpload.default());

  router.post('/api/v1/users/register', (req, res) => {
    registerUser(req, res);
  });

  router.post('/api/v1/users/login', (req, res) => {
    loginUser(req, res);
  });

  router.get('/api/v1/users/check-account', (req, res) => {
    checkUser(req, res);
  });

  router.post('/api/v1/users/change-avatar', (req, res) => {
    uploadImage(req, res);
  });

  router.get(`${verificationApi}:verificationCodeId`, (req, res) => {
    verifyUser(req, res);
  });

  router.post('/api/v1/users/change-password', (req, res) => {
    changePassword(req, res);
  });

  router.post('/api/v1/users/reset-password', (req, res) => {
    resetPassword(req, res);
  });

  router.post('/api/v1/users/change-email', (req, res) => {
    changeEmail(req, res);
  });

  router.post('/api/v1/users/delete-account', (req, res) => {
    deleteAccount(req, res);
  });

  router.get('/api/v1/ip', (req, res) => {
    apiIp(req, res);
  });

  router.get(`/${imagesPath.join('/')}`, (req, res) => {
    res.send(403).json({ error: 'Not Allowed' });
  });
  return router;
}
