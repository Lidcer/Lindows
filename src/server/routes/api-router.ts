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
} from './users';
import { imagesPath } from '../database/Users';

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

  router.get('/api/v1/users/checkAccount', (req, res) => {
    checkUser(req, res);
  });

  router.post('/api/v1/users/changeAvatar', (req, res) => {
    uploadImage(req, res);
  });

  router.get(`${verificationApi}:verificationCodeId`, (req, res) => {
    verifyUser(req, res);
  });

  router.post('/api/v1/users/reset_password', (req, res) => {
    changePassword(req, res);
  });

  router.post('/api/v1/users/change_email', (req, res) => {
    changeEmail(req, res);
  });

  router.post('/api/v1/users/delete_account', (req, res) => {
    deleteAccount(req, res);
  });

  router.get(`/${imagesPath.join('/')}`, (req, res) => {
    res.send(403).json({ error: 'Not Allowed' });
  });
  return router;
}
