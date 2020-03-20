import bodyParser from 'body-parser';
import * as fileUpload from 'express-fileupload';
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  deleteAccount,
  changeEmail,
  temporarilyTokenAccountAltering,
  changePassword,
  checkUser,
  uploadImage,
  changeDisplayedName,
  checkOutTemporarilyToken,
  resetPasswordLink,
} from './apiUsers';
import { imagesPath } from '../database/Users';
import { apiIp } from './apiIP';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
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

  router.post(`/api/v1/users/alter`, (req, res) => {
    temporarilyTokenAccountAltering(req, res);
  });

  router.get(`/api/v1/users/check-token`, (req, res) => {
    checkOutTemporarilyToken(req, res);
  });

  router.post('/api/v1/users/reset-password', (req, res) => {
    resetPasswordLink(req, res);
  });

  router.post('/api/v1/users/change-password', (req, res) => {
    changePassword(req, res);
  });

  router.post('/api/v1/users/change-displayed-name', (req, res) => {
    changeDisplayedName(req, res);
  });

  router.post('/api/v1/users/change-email', (req, res) => {
    changeEmail(req, res);
  });

  router.delete('/api/v1/users/delete-account', (req, res) => {
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
