import dotenv from "dotenv";
import findUp from "find-up";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

type DatabaseType = "mongoDB" | "mySql" | "none";

interface IConfig {
  SERVER_PORT?: number;
  PRIVATE_KEY?: string;
  MODNGO_DATABASE_CONNECTION_STRING?: string;
  SENDGRIND_API_KEY?: string;
  SECRET?: string;
  DATABASE?: {
    USERNAME: string;
    HOST: string;
    PASSWORD: string;
    DATABASE: string;
  };
}

const IS_DEV = process.env.NODE_ENV !== "production";

if (IS_DEV) {
  dotenv.config({ path: findUp.sync(".env") });
}

let config: IConfig = {
  MODNGO_DATABASE_CONNECTION_STRING: "",
  PRIVATE_KEY: "",
  SECRET: "",
  SENDGRIND_API_KEY: "",
  SERVER_PORT: 5050,
};

const packageJsonPath = path.join(process.cwd(), "package.json");
const configJsonPath = path.join(process.cwd(), "config.json");
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

try {
  const rawConfigJson = fs.readFileSync(configJsonPath).toString();
  config = JSON.parse(rawConfigJson);
} catch (error) {
  /* ignored */
}

if (!config.PRIVATE_KEY || !config.SECRET) {
  regenerateConfig();
}

// server
const SERVER_PORT = process.env.PORT || config.SERVER_PORT || 5050;
const WEBPACK_PORT = 8085; // For dev environment only
const PRIVATE_KEY = config.PRIVATE_KEY;
const MONGO_DATABASE_CONNECTION_STRING =
  config.MODNGO_DATABASE_CONNECTION_STRING || "mongodb://localhost:27017/lindows";
const DATABASE_CRIENDTIALS = config.DATABASE;
const SENDGRIND_API_KEY = config.SENDGRIND_API_KEY;
const SECRET = config.SECRET;
const DATA_BASE_TYPE = getDataBaseType();

function getDataBaseType(): DatabaseType {
  if (config.MODNGO_DATABASE_CONNECTION_STRING) {
    return "mongoDB";
  } else if (config.DATABASE && config.DATABASE.USERNAME && config.DATABASE.PASSWORD) {
    return "mySql";
  }
  return "none";
}

export function regenerateConfig(shouldShutDownServer = false) {
  config.PRIVATE_KEY = randomBytes(64).toString("base64");
  config.SECRET = randomBytes(64).toString("base64");
  updateConfig();
  if (shouldShutDownServer) {
    console.log("\n\n\n\n");
    console.log("========================");
    console.warn("SHUTING DOWN SERVER");
    console.log("========================");
    process.exit(0);
  }
}

function updateConfig() {
  fs.writeFileSync(configJsonPath, JSON.stringify(config, undefined, 1));
}

export {
  IS_DEV,
  VERSION,
  DATABASE_CRIENDTIALS,
  DATA_BASE_TYPE,
  SERVER_PORT,
  WEBPACK_PORT,
  MONGO_DATABASE_CONNECTION_STRING as DATABASE_CONNECTION_STRING,
  PRIVATE_KEY,
  SENDGRIND_API_KEY,
  SECRET,
};
