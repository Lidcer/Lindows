import { Mongoose, ConnectionOptions } from "mongoose";
import { DATABASE_CONNECTION_STRING, DATABASE_CRIENDTIALS, DATA_BASE_TYPE, IS_DEV } from "../config";
import { join } from "path";
import { setupImages } from "../routes/users/users-database";
import { existFile, mkdir } from "../FsUtils";
import { Sequelize } from "sequelize";
const data = join(process.cwd(), "data");

const options: ConnectionOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: true,
  useCreateIndex: true,
};

export let dbConnection = false;
export const mongoose = new Mongoose(); // make monoose optional
const shouldLog = false;
const logger =
  IS_DEV && shouldLog
    ? function (...args) {
        console.debug.apply(console, ["database", args]);
      }
    : false;
export const sql = new Sequelize({
  username: DATABASE_CRIENDTIALS.USERNAME,
  password: DATABASE_CRIENDTIALS.PASSWORD,
  host: DATABASE_CRIENDTIALS.HOST,
  database: DATABASE_CRIENDTIALS.DATABASE,
  logging: logger,
  dialect: "mysql",
});
export async function setupDatabase(): Promise<void> {
  if (DATA_BASE_TYPE === "mongoDB") {
    mongoose.connection.on("open", () => {
      dbConnection = true;
      IS_DEV && console.log("open connection to mongo server.");
    });

    mongoose.connection.on("connected", () => {
      dbConnection = true;
      IS_DEV && console.log("connected to mongo server.");
    });

    mongoose.connection.on("disconnected", () => {
      dbConnection = false;
      IS_DEV && console.log("disconnected from mongo server.");
    });

    mongoose.connection.on("close", () => {
      dbConnection = false;
      IS_DEV && console.log("close connection to mongo server");
    });

    mongoose.connection.on("error", err => {
      dbConnection = false;
      IS_DEV && console.log("error connection to mongo server!");
      console.error(err);
    });

    mongoose.connection.on("reconnect", () => {
      dbConnection = true;
      IS_DEV && console.log("reconnect to mongo server.");
    });

    await mongoose.connect(DATABASE_CONNECTION_STRING, options);
    IS_DEV && console.debug("Using mongodb Database");
  }
  if (DATA_BASE_TYPE === "mySql") {
    await sql.authenticate();
    await sql.sync();
    dbConnection = true;
    IS_DEV && console.debug("Using mysql Database");
  }

  if (DATA_BASE_TYPE === "none") {
    console.error("Database is not setup");
    if (!IS_DEV) throw new Error("Cannot run production mode without database!");
  }

  const exists = await existFile(data);
  if (exists) {
    await setupImages();
  } else {
    await mkdir(data);
    await setupImages();
  }
}
