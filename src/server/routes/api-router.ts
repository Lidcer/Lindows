import bodyParser from 'body-parser';
import { Router } from 'express';
import { userGet, userPost } from './users';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  router.use(bodyParser.json());

  router.post('/api/v1/users', (req, res) => {
    console.log(req.body, req.params, req);
    userPost(req, res);
  });

  router.get('/api/v1/users/:userId', (req, res) => {
    userGet(req, res);
  });

  router.get('/api/v1/', (req, res) => {
    const userId = req.params.userId;
    res.json({ test: 'setse' });
  });

  router.post('/api/set-user', (req, res) => {
    res.send(`ok`);
  });

  return router;
}
