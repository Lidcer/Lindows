import bodyParser from 'body-parser';
import { Router } from 'express';
import { registerUser, loginUser, deleteAccount, changeEmail, verifyUser, changePassword } from './users';

export const verificationApi = '/api/v1/users/verify/';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  router.use(bodyParser.json());

  router.post('/api/v1/users/register', (req, res) => {
    registerUser(req, res);
  });

  router.get('/api/v1/users/login', (req, res) => {
    loginUser(req, res);
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

  return router;
}
