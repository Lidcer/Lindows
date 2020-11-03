import { Router } from "express";
import { getManifest } from "./manifest-manager";
import { IS_DEV } from "../config";
import { isUserAdmin } from "./admin/admin-api-routes";
import { dbConnection } from "../database/database";

export function pagesRouter() {
  const router = Router();
  if (IS_DEV) {
    router.get(`/test/**`, async (_, res) => {
      if (!dbConnection) {
        return res.render("failedToBoot.ejs");
      }

      const manifest = await getManifest();
      res.render("test.ejs", { manifest });
    });
  }

  router.get(`/admin/**`, async (req, res) => {
    if (!dbConnection) {
      return res.render("failedToBoot.ejs");
    }
    const manifest = await getManifest();
    if (await isUserAdmin(req)) {
      res.render("admin.ejs", { manifest });
    }

    return res.render("page.ejs", { manifest });
  });

  router.get(`/unsupported-browser**`, async (_, res) => {
    const manifest = await getManifest();
    res.render("unsupported-browser.ejs", { manifest });
  });

  router.get(`/**`, async (req, res) => {
    if (!dbConnection) {
      return res.render("failedToBoot.ejs");
    }
    const userAgent = req.headers["user-agent"];
    const manifest = await getManifest();
    if (userAgent.match(/Trident.*rv[ :]*11\.|Edge/)) {
      return res.render("unsupported-browser.ejs", { manifest });
    }
    res.render("page.ejs", { manifest });
  });

  return router;
}
