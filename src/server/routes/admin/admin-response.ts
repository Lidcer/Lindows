import { Request, Response } from "express";
import { IResponse } from "../../../shared/ApiUsersRequestsResponds";
import { IMongooseUserSchema, MongoUser, UserAccountFlags, changeAvatar, getUserImage } from "../users/users-database";
import { logger, getAllEvents, prettifyEvent, IEventLog, getEventById } from "../../database/EventLog";
import * as os from "os";
import * as disk from "node-disk-info";
import { respondWithError } from "../common";
import { WebSocket } from "../../websocket/SocketHandler";
import Joi from "@hapi/joi";
import { SECOND } from "../../../shared/constants";
import fingerprintjs from "fingerprintjs2";

let websocket: WebSocket;
const fingerprintedSockets = new Map<string, fingerprintjs.Component[]>();

export function setupAdminWebsocketController(wb: WebSocket) {
  websocket = wb;
}

interface IServerInfo {
  memoryUsage: NodeJS.MemoryUsage;
  version: string;
  arch: string;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  os: {
    cpus: os.CpuInfo[];
    userInfo: os.UserInfo<string>;
    platform: string;
    release: string;
    totalmem: number;
    uptime: number;
    disks: IDisk[];
  };
}

interface IDisk {
  available: number;
  blocks: number;
  capacity: string;
  filesystem: string;
  mounted: string;
  used: number;
}

export async function serverInfo(req: Request, res: Response, account: IMongooseUserSchema) {
  const response: IResponse<IServerInfo> = {};
  const rawDiskData = await disk.getDiskInfo();
  const diskData: IDisk[] = [];

  for (const { available, blocks, capacity, filesystem, mounted, used } of rawDiskData) {
    diskData.push({ available, blocks, capacity, filesystem, mounted, used });
  }

  response.success = {
    memoryUsage: process.memoryUsage(),
    version: process.version,
    arch: process.arch,
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
    os: {
      cpus: os.cpus(),
      userInfo: os.userInfo(),
      platform: os.platform(),
      release: os.release(),
      totalmem: os.totalmem(),
      uptime: os.uptime(),
      disks: diskData,
    },
  };

  logger.log("[ADMIN]", `User ${account.username} : ${account._id.toString()}  obtained data from server info`);
  res.status(200).json(response);
}

export async function eventLog(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$EventLog = Joi.object({
    eventID: Joi.string(),
  });

  const result = joi$EventLog.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  try {
    const eventsRaw = await getEventById(req.body.eventID);

    const response: IResponse<IEventLog> = {
      success: prettifyEvent(eventsRaw),
    };

    logger.log(
      "[ADMIN]",
      `User ${account.username} : ${account._id.toString()} obtained event log ${response.success.id}`,
    );
    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}

export async function eventLogDelete(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$eventLog = Joi.object({
    eventID: Joi.string(),
  });

  const result = joi$eventLog.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  try {
    const schema = await getEventById(req.body.eventID);
    const id = schema._id.toString();
    await schema.remove();

    const response: IResponse<string> = {
      success: "Deleted successfully",
    };

    logger.log("[ADMIN]", `User ${account.username} : ${account._id.toString()} removed event ${id}`);
    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}

export async function eventLogs(req: Request, res: Response, account: IMongooseUserSchema) {
  const response: IResponse<IEventLog[]> = {};
  try {
    const eventsRaw = await getAllEvents();

    const eventLog: IEventLog[] = [];
    for (const eventRat of eventsRaw) {
      eventLog.push(prettifyEvent(eventRat));
    }

    response.success = eventLog;
    logger.log("[ADMIN]", `User ${account.username} : ${account._id.toString()} obtained data from event log`);
    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}

interface IAdminAccount {
  id: string;
  username: string;
  displayedName: string;
  compromised: boolean;
  banned: boolean;
  createdAt: number;
  lastOnlineAt: number;
  avatar: string;
  email: string;
  verified: boolean;
  note: string;
  ip: string[];
  roles: string[];
  flags: UserAccountFlags[];
}

function stripAccountData(accountRaw: IMongooseUserSchema) {
  return {
    id: accountRaw._id.toString(),
    avatar: getUserImage(accountRaw),
    banned: accountRaw.banned,
    compromised: accountRaw.compromised,
    createdAt: accountRaw.createdAt,
    displayedName: accountRaw.displayedName,
    email: accountRaw.email,
    flags: accountRaw.flags,
    ip: accountRaw.ip,
    lastOnlineAt: accountRaw.lastOnlineAt,
    roles: accountRaw.roles,
    note: accountRaw.note,
    username: accountRaw.username,
    verified: accountRaw.verified,
  };
}

export async function accounts(req: Request, res: Response, account: IMongooseUserSchema) {
  const response: IResponse<IAdminAccount[]> = {};
  try {
    const accountsRaw = await MongoUser.find();
    const accounts: IAdminAccount[] = [];

    for (const accountRaw of accountsRaw) {
      accounts.push(stripAccountData(accountRaw));
    }

    response.success = accounts;
    logger.log("[ADMIN]", `User ${account.username} : ${account._id.toString()} obtained accounts data`);
    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}
interface IAccountID {
  accountID: string;
}
export async function account(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$broadcaster = Joi.object<IAccountID>({
    accountID: Joi.string(),
  });

  const result = joi$broadcaster.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  try {
    const schema = await MongoUser.findById(req.body.accountID);

    const response: IResponse<IAdminAccount> = {
      success: stripAccountData(schema),
    };
    logger.log(
      "[ADMIN]",
      `User ${account.username} : ${account._id.toString()} obtained account data ${response.success.username} ${
        response.success.id
      }`,
    );
    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}

export async function accountDelete(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$Account = Joi.object<IAccountID>({
    accountID: Joi.string(),
  });

  const result = joi$Account.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  try {
    const schema = await MongoUser.findById(req.body.accountID);
    await schema.remove();

    const response: IResponse<string> = {
      success: "Account has been deleted",
    };
    logger.log(
      "[ADMIN]",
      `User ${account.username} : ${account._id.toString()} obtained account data ${
        schema.username
      } ${schema._id.toString()}`,
    );
    res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}

export async function accountUpdate(req: Request, res: Response, account: IMongooseUserSchema) {
  return res.status(501).json({});
  const joi$broadcaster = Joi.object<IAccountID>({
    accountID: Joi.string(),
  });

  const result = joi$broadcaster.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  try {
    const schema = await MongoUser.findById(req.body.accountID);

    // res.status(200).json(response);
  } catch (error) {
    return respondWithError(res, 500, "Internal server error");
  }
}

interface IWebSocketInfo {
  id: string;
  ip: string;
  account?: IAdminAccount;
  fingerprint?: fingerprintjs.Component[];
}

export async function webSocketsInfo(req: Request, res: Response, account: IMongooseUserSchema) {
  const response: IResponse<IWebSocketInfo[]> = {};
  try {
    const clientsRaw = websocket.getClients();
    const websocketInfo: IWebSocketInfo[] = [];

    for (const clientRaw of clientsRaw) {
      const schema = websocket.getClientUserSchema(clientRaw);
      const fingerprint = fingerprintedSockets.get(clientRaw.id);
      let stripedAccountData = null;
      if (schema) {
        stripedAccountData = stripAccountData(schema);
      }
      const ip = clientRaw.conn.remoteAddress;
      websocketInfo.push({ id: clientRaw.id, ip, account: stripedAccountData, fingerprint });
    }

    response.success = websocketInfo;
    logger.log("[ADMIN]", `User ${account.username} : ${account._id.toString()} obtained websocket data`);
    res.status(200).json(response);
  } catch (error) {
    logger.error("API Websockets info", error);
    return respondWithError(res, 500, "Internal server error");
  }
}

interface ISocketID {
  socketID: string;
}

export async function webSocketInfo(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$Account = Joi.object<ISocketID>({
    socketID: Joi.string(),
  });

  const result = joi$Account.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }

  const response: IResponse<IWebSocketInfo> = {};
  try {
    const clientRaw = websocket.getClients().find(f => f.id === req.body.socketID);

    if (!clientRaw) {
      return respondWithError(res, 400, "Socket does not exist");
    }

    const schema = websocket.getClientUserSchema(clientRaw);

    const fingerprint = fingerprintedSockets.get(clientRaw.id);
    let socketAccount: IAdminAccount = null;
    if (schema) {
      socketAccount = stripAccountData(schema);
    }
    const ip = clientRaw.conn.remoteAddress;
    response.success = { id: clientRaw.id, ip, account: socketAccount, fingerprint };
    logger.log(
      "[ADMIN]",
      `User ${account.username} : ${account._id.toString()} obtained websocket info ${clientRaw.id}`,
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error("API Websocket info", error);
    return respondWithError(res, 500, "Internal server error");
  }
}

interface IWebSocketBroadcast {
  value: string;
  arg0: string;
  arg1?: string;
  arg2?: string;
}

export function broadcastWebSocket(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$broadcaster = Joi.object<IWebSocketBroadcast>({
    value: Joi.string(),
    arg0: Joi.string(),
    arg1: Joi.string().optional,
    arg2: Joi.string().optional,
  });

  const result = joi$broadcaster.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  const args = [req.body.arg0, req.body.arg1, req.body.arg2, req.body.arg3].filter(f => f);

  logger.info(
    "[Admin broadcast]",
    `User ${account.username}:${account._id.toString()} broadcasted ${req.body.value} ${args.join(", ")}`,
  );
  websocket.broadcast(req.body.value, req.body.arg0, req.body.arg1, req.body.arg2);

  const response: IResponse<string> = {
    success: `Broadcasted to ${websocket.getClients().length}`,
  };
  res.status(200).json(response);
}

interface IWebSocketDisconnectClient {
  socketID: string;
}

export function disconnectClient(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$broadcaster = Joi.object<IWebSocketDisconnectClient>({
    socketID: Joi.string(),
  });

  const result = joi$broadcaster.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  const client = websocket.getClients().find(w => w.id === req.body.socketID);
  if (!client) {
    return respondWithError(res, 400, "Client is not connected to websocket");
  }
  const schema = websocket.getClientUserSchema(client);

  client.disconnect();

  logger.info(
    "[Admin client disconnect]",
    `Client ${account.username}:${account._id.toString()} disconnected client ${client.id} ${
      schema ? `${schema.username} ${schema._id.toString()}` : ""
    }}`,
  );

  const response: IResponse<string> = {
    success: `Client has been disconnected from websocket`,
  };
  res.status(200).json(response);
}

export function fingerprintClient(req: Request, res: Response, account: IMongooseUserSchema) {
  const joi$fingerprint = Joi.object<IWebSocketDisconnectClient>({
    socketID: Joi.string(),
  });

  const result = joi$fingerprint.validate(req.body);
  if (result.error) {
    return adminJoiErrorResponse(res, result);
  }
  const client = websocket.getClients().find(w => w.id === req.body.socketID);
  if (!client) {
    return respondWithError(res, 400, "Client is not connected to websocket");
  }

  let to: NodeJS.Timeout = undefined;

  const success = (result: fingerprintjs.Component[]) => {
    if (!to) clearTimeout(to);
    if (!websocket.socketValidator.validateArray(client, result)) return;
    fingerprintedSockets.set(client.id, result);
    const schema = websocket.getClientUserSchema(client);
    let stripedAccountData: IAdminAccount;
    if (schema) {
      stripedAccountData = stripAccountData(schema);
    }

    const response: IResponse<IWebSocketInfo> = {
      success: {
        id: client.id,
        ip: client.conn.remoteAddress,
        account: stripedAccountData,
        fingerprint: result,
      },
      message: `Fingerprint's taken`,
    };
    res.status(200).json(response);
  };

  client.on("fingerprint-result", success);
  client.emit("take-fingerprint", success);
  to = setTimeout(() => {
    client.removeListener("fingerprint-result", success);
    return respondWithError(res, 400, "Unable to fingerprint client");
  }, SECOND * 10);
}

export function executeCommand(req: Request, res: Response, account: IMongooseUserSchema) {}

function adminJoiErrorResponse(res: Response, joi: Joi.ValidationResult) {
  const response: IResponse<any> = {
    error: joi.error.message,
    details: joi.error,
  };
  res.status(400).json(response);
}
