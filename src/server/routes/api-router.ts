import bodyParser from 'body-parser';
import * as fileUpload from 'express-fileupload';
import { Router } from 'express';
import { setupUsersApi } from './users/users-api-routes';
import { setupLypeUsersApi } from './lype/lype-api-routes';
import { setupAdminApi } from './admin/admin-api-routes';
import { setupIpApi } from './ip/ip-api-routes';

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
  router.use(bodyParser.json());
  router.use(fileUpload.default());

  setupUsersApi(router);
  setupLypeUsersApi(router);
  setupAdminApi(router);
  setupIpApi(router);

  return router;
}
