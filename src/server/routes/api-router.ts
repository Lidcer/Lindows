import bodyParser from "body-parser";
import * as fileUpload from "express-fileupload";
import { Router } from "express";
import { setupUsersApi } from "./users/users-api-routes";
import { setupLypeUsersApi } from "./lype/lype-api-routes";
import { setupAdminApi } from "./admin/admin-api-routes";
import { setupIpApi } from "./ip/ip-api-routes";
import { IS_DEV } from "../config";
import { dbConnection } from "../database/database";

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.urlencoded({ extended: false }));
  router.use(bodyParser.json());
  router.use(fileUpload.default());

  router.post("/api/v1/ready", (req, res) => {
    res.status(200).json({ ready: dbConnection });
  });

  setupUsersApi(router);
  if (IS_DEV) {
    setupLypeUsersApi(router);
  }

  setupAdminApi(router);
  setupIpApi(router);

  return router;
}
