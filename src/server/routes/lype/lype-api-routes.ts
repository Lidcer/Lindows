import { Router } from 'express';
import * as Axios from 'axios';

import {
  checkLypeUser,
  createLypeUser,
  addLypeFriend,
  removeLypeFriend,
  unblockLypeUser,
  blockLypeUser,
  findLypeUsers,
} from './lype-response';

export function setupLypeUsersApi(router: Router) {
  router.post('/api/v1/lype/check-lype-user', (req, res) => {
    checkLypeUser(req, res);
  });

  router.post('/api/v1/lype/create-lype-user', (req, res) => {
    createLypeUser(req, res);
  });

  router.post('/api/v1/lype/find-users', (req, res) => {
    findLypeUsers(req, res);
  });

  router.put('/api/v1/lype/add-friend', (req, res) => {
    addLypeFriend(req, res);
  });

  router.put('/api/v1/lype/remove-friend', (req, res) => {
    removeLypeFriend(req, res);
  });

  router.put('/api/v1/lype/block-user', (req, res) => {
    blockLypeUser(req, res);
  });

  router.put('/api/v1/lype/unblock-user', (req, res) => {
    unblockLypeUser(req, res);
  });

  router.post('/api/v1/web-explorer/', async (req, res) => {

    try {
      const data = await Axios.default.get(req.body.url)

      const html = data.data;
      return res.status(200).json({html});
    
    } catch (error) {
      return res.status(404).render('');
    
    }
  });

  // router.post('/api/v1/lype/post-message', (req, res) => {
  //   postMessage(req, res);
  // });

  // router.delete('/api/v1/lype/remove-message', (req, res) => {
  //   deleteMessage(req, res);
  // });
}
