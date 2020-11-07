import express from "express";
import { listen } from "socket.io";
import path from "path";
import { apiRouter } from "./routes/api-router";
import { pagesRouter } from "./routes/pages-router";
import { staticsRouter } from "./routes/statics-router";
import * as config from "./config";
import { WebSocket } from "./websocket/SocketHandler";
import { dbConnection, setupDatabase, sql } from "./database/database";
import { MailService } from "./routes/mail";
import { logger } from "./database/EventLog";
import { setupLypeWebsocket } from "./routes/lype/lype-websocket-handler";
import { setupAdminWebsocketController } from "./routes/admin/admin-response";
import session from "express-session";
import mongoGBStore from "connect-mongodb-session";
import sequelizeGBStore from "connect-session-sequelize";
import { WEEK } from "../shared/constants";
import { setupGroupViewerWebsocket } from "./apps/GroupViewer/webSocket";
import { isMongo, isMySql } from "./database/modifiable";
import { IS_DEV } from "./config";
import { setupAppWebsocket } from "./apps/appComunnicate";
const MongoDBStore = mongoGBStore(session);
const SequelizeStore = sequelizeGBStore(session.Store);

export const name = "Lindows";
export const version = "0.0.1 Alpha";
export const fullName = `${name} ,${version}`;
const sessionName = "Lindows_sessions";

console.info(`*******************************************`);
console.info(`App: ${fullName}`);
console.info(`NODE_ENV: ${process.env.NODE_ENV}`);
console.info(`config: ${JSON.stringify(config, null, 2)}`);
console.info(`*******************************************`);

let store: session.Store | undefined;
const maxAge = WEEK * 2;
if (isMongo()) {
  store = new MongoDBStore({
    uri: config.DATABASE_CONNECTION_STRING,
    collection: sessionName,
  });
} else if (isMySql()) {
  store = new SequelizeStore({
    db: sql,
    checkExpirationInterval: maxAge,
    expiration: maxAge,
    tableName: sessionName,
  });
}

const theSession = session({
  name: fullName,
  resave: true,
  rolling: true,
  saveUninitialized: true,
  secret: config.SECRET,
  store,
  cookie: {
    maxAge,
    sameSite: true,
    secure: !config.IS_DEV,
  },
});

const app = express();
app.set("view engine", "ejs");

app.use("/assets", express.static(path.join(process.cwd(), "assets")));
app.use((req, res, next) => {
  if (!dbConnection) {
    return res.render("failedToBoot.ejs");
  }
  next();
});
app.use(theSession);
app.use(apiRouter());
app.use(staticsRouter());
app.use(pagesRouter());
app.disable("x-powered-by");
const http = app.listen(config.SERVER_PORT, () => {
  console.log(`App listening on port ${config.SERVER_PORT}!`);
});

const io = listen(http);
export const websocket = new WebSocket(io);

if (IS_DEV) {
  setupLypeWebsocket(websocket);
}

setupAppWebsocket(websocket);
setupGroupViewerWebsocket(websocket);
setupAdminWebsocketController(websocket);
export const mailService = new MailService(config.SENDGRIND_API_KEY);

async function start() {
  try {
    await setupDatabase();

    logger.info("Server started");
  } catch (error) {
    console.error(error);
    //process.exit(1);
  }
}
start();

process.on("uncaughtException", uncaughtException => {
  logger.fatal("uncaughtException", uncaughtException);
});

process.on("unhandledRejection", unhandledRejection => {
  logger.fatal("unhandledRejection", unhandledRejection);
});
