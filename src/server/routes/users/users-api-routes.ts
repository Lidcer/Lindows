import { Router } from 'express';
import {
  registerUser,
  loginUser,
  checkUser,
  uploadImage,
  temporarilyTokenAccountAltering,
  checkOutTemporarilyToken,
  resetPasswordLink,
  changePassword,
  changeDisplayedName,
  changeEmail,
  deleteAccount,
} from './users-responses';
import { imagesPath } from './users-database';

export function setupUsersApi(router: Router) {
  router.post('/api/v1/users/register', (req, res) => {
    registerUser(req, res);
  });

  router.post('/api/v1/users/login', (req, res) => {
    loginUser(req, res);
  });

  router.get('/api/v1/users/check-account', (req, res) => {
    checkUser(req, res);
  });

  router.put('/api/v1/users/change-avatar', (req, res) => {
    uploadImage(req, res);
  });

  router.put(`/api/v1/users/alter`, (req, res) => {
    temporarilyTokenAccountAltering(req, res);
  });

  router.get(`/api/v1/users/check-token`, (req, res) => {
    checkOutTemporarilyToken(req, res);
  });

  router.put('/api/v1/users/reset-password', (req, res) => {
    resetPasswordLink(req, res);
  });

  router.put('/api/v1/users/change-password', (req, res) => {
    changePassword(req, res);
  });

  router.put('/api/v1/users/change-displayed-name', (req, res) => {
    changeDisplayedName(req, res);
  });

  router.put('/api/v1/users/change-email', (req, res) => {
    changeEmail(req, res);
  });

  router.delete('/api/v1/users/delete-account', (req, res) => {
    deleteAccount(req, res);
  });

  router.get(`/${imagesPath.join('/')}`, (req, res) => {
    res.send(403).json({ error: 'Not Allowed' });
  });
}
