import { Router } from 'express';
import { getManifest } from './manifest-manager';
import { IS_DEV } from '../config';

export function pagesRouter() {
  const router = Router();
  if (IS_DEV) {
    router.get(`/test/**`, async (_, res) => {
      const manifest = await getManifest();
      res.render('test.ejs', { manifest });
    });
  }

  router.get(`/admin/**`, async (_, res) => {
    const manifest = await getManifest();
    res.render('admin.ejs', { manifest });
  });

  router.get(`/obsolete-browser**`, async (_, res) => {
    const manifest = await getManifest();
    res.render('obsolete-browser.ejs', { manifest });
  });

  router.get(`/terms-of-service**`, async (_, res) => {
    const manifest = await getManifest();
    res.render('terms-of-service.ejs', { manifest });
  });

  router.get(`/**`, async (_, res) => {
    const manifest = await getManifest();
    res.render('page.ejs', { manifest });
  });

  return router;
}
