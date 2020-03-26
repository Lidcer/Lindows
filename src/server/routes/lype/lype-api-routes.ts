import { Router } from 'express';
import {
  checkLypeUser,
  createLypeUser,
  addLypeFriend,
  removeLypeFriend,
  unblockLypeUser,
  blockLypeUser,
  findLypeFriend,
} from './lype-response';

export function setupLypeUsersApi(router: Router) {
  router.get('/api/v1/lype/check-lype-user', (req, res) => {
    checkLypeUser(req, res);
  });

  router.post('/api/v1/lype/create-lype-user', (req, res) => {
    createLypeUser(req, res);
  });

  router.get('/api/v1/lype/find-friend', (req, res) => {
    findLypeFriend(req, res);
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

  // router.post('/api/v1/lype/post-message', (req, res) => {
  //   postMessage(req, res);
  // });

  // router.delete('/api/v1/lype/remove-message', (req, res) => {
  //   deleteMessage(req, res);
  // });
}
