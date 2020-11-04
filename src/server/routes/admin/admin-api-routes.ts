import { Router, Request } from "express";

import { logger } from "../../database/EventLog";
import { TOKEN_HEADER } from "../../../shared/constants";
import { IJWTAccount, getTokenData } from "../common";
import { MongooseUserSchema, getUserById, UserModifiable } from "../users/users-database";
import { checkUser, resetPasswordLink } from "../users/users-responses";
import {
  executeCommand,
  serverInfo,
  eventLog,
  accounts,
  webSocketInfo,
  broadcastWebSocket,
  fingerprintClient,
  eventLogs,
  eventLogDelete,
  account,
  accountDelete,
  accountUpdate,
  webSocketsInfo,
} from "./admin-response";

export function setupAdminApi(router: Router) {
  router.get("/api/v1/admin/check-admin", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    checkUser(req, res);
  });

  router.get("/api/v1/admin/server-info", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    serverInfo(req, res, user);
  });

  router.post("/api/v1/admin/event-log", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    eventLog(req, res, user);
  });

  router.delete("/api/v1/admin/event-log", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    eventLogDelete(req, res, user);
  });

  router.get("/api/v1/admin/event-logs", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    eventLogs(req, res, user);
  });

  router.get("/api/v1/admin/accounts", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    accounts(req, res, user);
  });

  router.post("/api/v1/admin/account", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    account(req, res, user);
  });

  router.delete("/api/v1/admin/account", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    accountDelete(req, res, user);
  });

  router.put("/api/v1/admin/account", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    accountUpdate(req, res, user);
  });

  router.get("/api/v1/admin/web-sockets-info", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    webSocketsInfo(req, res, user);
  });

  router.post("/api/v1/admin/web-socket-info", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    webSocketInfo(req, res, user);
  });

  router.post("/api/v1/admin/socket-broadcast", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    broadcastWebSocket(req, res, user);
  });

  router.post("/api/v1/admin/fingerprint-socket", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    fingerprintClient(req, res, user);
  });

  router.post("/api/v1/admin/execute-command", async (req, res) => {
    const user = await isUserAdmin(req);
    if (!user) return res.status(403).send();
    executeCommand(req, res, user);
  });
}

export async function isUserAdmin(req: Request): Promise<UserModifiable | null> {
  const token = req.headers[TOKEN_HEADER] || req.session.token;
  logger.debug(`Checking user`, req.headers[TOKEN_HEADER]);
  const decoded: IJWTAccount = await getTokenData(req, token);
  if (!decoded) {
    logger.warn(`Unable to decode token`);
    return null;
  }
  let user: UserModifiable;
  try {
    user = await getUserById(decoded.id);
    if (!user) return null;
    if (user.banned) return null;
    if (user.compromised) return null;
  } catch (error) {
    return null;
  }
  if (user.roles.includes("admin") || user.roles.includes("superadmin")) {
    return user;
  }
  logger.warn(`${user.username} tried to access admin panel`);
  return null;
}
