import { Document, Schema } from "mongoose";
import { attachDebugMethod } from "../devDebugger";
import moment from "moment";
import chalk from "chalk";
import { mongoose, sql } from "./database";
import { Stringify } from "../../shared/utils";
import { IS_DEV } from "../config";
import { WebSocket } from "../websocket/SocketHandler";
import path from "path";
import { writeFile, appendFile } from "fs";
import { DataTypes, Model } from "sequelize";
import { isMongo, isMySql, Modifiable } from "./modifiable";

const { white, yellow, red } = chalk;

export interface EventLog {
  type: string;
  time: number;
  message?: string;
  details?: string;
  error?: string;
}
export interface DataEventLog extends EventLog {
  id: string;
}

export interface IMongooseEventLog extends Document, EventLog {}

const EventLogSchema = new Schema<IMongooseEventLog>(
  {
    type: { type: String, required: true },
    time: { type: Date, required: true },
    message: String,
    details: String,
    error: String,
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

interface SqlEventLog extends EventLog {
  id: number;
}
class EventLogMySql extends Model<SqlEventLog, EventLog> implements SqlEventLog {
  public id: number;
  public type: string;
  public time: number;
  public message?: string;
  public details?: string;
  public error?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EventLogMySql.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    message: DataTypes.TEXT,
    details: DataTypes.TEXT,
    error: DataTypes.TEXT,
  },
  { sequelize: sql, modelName: "event_log" },
);

export class EventLogModifiable extends Modifiable<IMongooseEventLog, EventLogMySql> implements EventLog {
  get type(): string {
    return this.db.type;
  }
  get time(): number {
    return this.db.time;
  }
  get message(): string {
    return this.db.message;
  }
  get error(): string {
    return this.db.error || null;
  }

  get id(): number {
    if (this.isMongo(this.db)) {
      return this.db._id;
    } else if (this.isMySql) {
      return this.db.id;
    }
  }
  get details(): string {
    return this.db.details;
  }
  set details(details) {
    this.db.details = details;
  }

  async save() {
    await this.db.save();
    return this;
  }
  async remove() {
    if (this.isMongo(this.db)) {
      await this.db.remove();
    } else if (this.isMySql(this.db)) {
      await this.db.destroy();
    }
  }
}

const MongoEventLog = mongoose.model<IMongooseEventLog>("events", EventLogSchema);

export async function getAllEvents() {
  let result: EventLogModifiable[] | undefined;
  if (isMongo()) {
    const found = await MongoEventLog.find();
    if (found) {
      result = found.map(m => new EventLogModifiable(m));
    }
  } else if (isMySql()) {
    const found = await EventLogMySql.findAll();
    if (found) {
      result = found.map(m => new EventLogModifiable(m));
    }
  }
  if (!result) return [];
  return result;
}

export async function getEventById(id: string) {
  if (isMongo()) {
    const data = await MongoEventLog.findById(id);
    if (!data) return undefined;
    return new EventLogModifiable(data);
  } else if (isMySql) {
    const data = await EventLogMySql.findByPk(parseInt(id));
    if (!data) return undefined;
    return new EventLogModifiable(data);
  }
}

export function prettifyEvent(eventLogModifiabel: EventLogModifiable) {
  const eventLog: DataEventLog = {
    id: eventLogModifiabel.id.toString(),
    type: eventLogModifiabel.type,
    time: eventLogModifiabel.time,
  };
  if (eventLogModifiabel.message) eventLog.message = eventLogModifiabel.message;
  if (eventLogModifiabel.details) eventLog.details = eventLogModifiabel.details;
  if (eventLogModifiabel.error) eventLog.error = eventLogModifiabel.error;
  return eventLog;
}

class Logger {
  private _websocket: WebSocket | undefined;
  constructor(private logLevel = 3) {
    attachDebugMethod("logger", this);
  }

  private getTime() {
    const date = moment.utc().toDate();
    const text = moment(date).format("MMMM Do YYYY, HH:mm:ss");
    return { date, text };
  }

  async saveToDataBase(type: string, time: Date, message?: string, details?: string[], error?: string) {
    let event: EventLogModifiable | undefined = undefined;

    const eventLog: EventLog = {
      type,
      time: time.getTime(),
    };
    if (message) eventLog.message = Stringify.do(message, true);
    if (details && details.length) eventLog.details = Stringify.do(details, true);
    if (error) eventLog.error = Stringify.do(error, true);

    try {
      if (isMongo()) {
        const schema = new MongoEventLog(eventLog);
        await schema.save();
        event = new EventLogModifiable(schema);
      } else if (isMySql()) {
        const mySqlEventLog = await EventLogMySql.create(eventLog);
        await mySqlEventLog.save();
        event = new EventLogModifiable(mySqlEventLog);
      }
    } catch (error) {
      console.error(error);
    }
    if (!event) {
      console.error("Unable to write event");
      return;
    }

    try {
      if (this._websocket) {
        const clients = this._websocket.getClientByRoles("admin");
        for (const client of clients) {
          client.emit("admin-event-log-report", prettifyEvent(event));
        }
      }
    } catch (error) {
      console.error(`Cannot store error`, error);
    }
    return event;
  }

  _setWebSocket(webSocket: WebSocket) {
    this._websocket = webSocket;
  }

  setLogLevel(logLevel = 2) {
    this.logLevel = logLevel;
  }

  writeLog = (...args) => {
    const logPath = path.join(process.cwd(), "logs.txt");
    const { text } = this.getTime();
    const line = `${text} ${args.join("\n")}\n${new Error().stack}`;
    return;
    appendFile(logPath, line, "utf-8", err => {
      if (err) {
        writeFile(logPath, line, "utf-8", err => {
          console.log(err, "done");
        });
      }
    });
  };

  debug(message: string, ...optionalParams: any[]) {
    if (!IS_DEV) return;
    this.writeLog([message, ...(optionalParams || [])]);
    const { text } = this.getTime();
    const args = [yellow(`${text}`), white("[debug]"), message, ...optionalParams].filter(a => a);
    console.debug.apply(null, args);
  }

  log(message: string, ...optionalParams: any[]) {
    if (!IS_DEV) return;
    this.writeLog([message, ...(optionalParams || [])]);
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), white("[log]"), message, ...optionalParams].filter(a => a);
    console.log.apply(null, args);
    if (this.logLevel > 4) {
      this.saveToDataBase("log", date, message, optionalParams);
    }
  }

  info(message: string, ...optionalParams: any[]) {
    this.writeLog([message, ...(optionalParams || [])]);
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), yellow("[INFO]"), message, ...optionalParams].filter(a => a);
    console.info.apply(null, args);
    if (this.logLevel > 3) {
      this.saveToDataBase("Info", date, message, optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]) {
    this.writeLog([message, ...(optionalParams || [])]);
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), red("[WARN]"), message, ...optionalParams].filter(a => a);
    console.warn.apply(null, args);
    if (this.logLevel > 2) {
      this.saveToDataBase("warn", date, message, optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]) {
    this.writeLog([message, ...(optionalParams || [])]);
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), red("[ERROR]"), message, ...optionalParams].filter(a => a);
    console.error.apply(null, [...args, new Error().stack]);
    if (this.logLevel > 1) {
      this.saveToDataBase("error", date, message, optionalParams, new Error().stack);
    }
  }

  fatal(message: string, ...optionalParams: any[]) {
    this.writeLog([message, ...(optionalParams || [])]);
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), red("[FATAL]"), message, ...optionalParams].filter(a => a);
    console.error.apply(null, [...args, new Error().stack]);
    if (this.logLevel > 0) {
      this.saveToDataBase("fatal", date, message, optionalParams, new Error().stack);
    }
  }
}

export const logger = new Logger();
