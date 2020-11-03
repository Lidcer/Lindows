import { Mongoose, ConnectionOptions } from "mongoose";
import { DATABASE_CONNECTION_STRING, IS_DEV } from "../config";
import { join } from "path";
import { setupImages } from "../routes/users/users-database";
import { existFile, mkdir } from "../FsUtils";
const data = join(process.cwd(), "data");

const options: ConnectionOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: true,
  useCreateIndex: true,
};

export const mongoose = new Mongoose();
export let dbConnection = false;

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

export async function setupDatabase(): Promise<void> {
  await mongoose.connect(DATABASE_CONNECTION_STRING, options);
  const exists = await existFile(data);
  if (exists) {
    await setupImages();
  } else {
    await mkdir(data);
    await setupImages();
  }
}
