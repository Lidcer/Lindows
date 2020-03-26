import bodyParser from 'body-parser';
import * as fileUpload from 'express-fileupload';
import { Router } from 'express';
import { imagesPath } from './users/users-database';
import { apiIp } from './apiIP';
import { setupUsersApi } from './users/users-api-routes';
import { setupLypeUsersApi } from './lype/lype-api-routes';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
  router.use(bodyParser.json());
  router.use(fileUpload.default());

  setupUsersApi(router);
  setupLypeUsersApi(router);

  router.get('/api/v1/ip', (req, res) => {
    apiIp(req, res);
  });

  return router;
}
