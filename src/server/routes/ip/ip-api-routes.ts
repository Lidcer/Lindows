import { Router } from 'express';
import { apiIp } from './apiIP';

export function setupIpApi(router: Router) {
    router.get('/api/v1/ip', (req, res) => {
        apiIp(req, res);
      });
}