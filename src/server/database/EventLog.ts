import { Document, Schema } from 'mongoose';
import { attachDebugMethod } from '../devDebugger';
import { getUTCTime } from '../../shared/time';
import moment from 'moment';
import chalk from 'chalk';
import { mongoose } from './database';
import { IS_DEV } from '../config';
import { WebSocket } from '../websocket/SocketHandler';

const { white, yellow, red } = chalk;

export interface IMongooseEventLog extends Document {
  type: string;
  time: Date;
  message?: string;
  details?: string[];
  error?: string;
}
export interface IEventLog {
  id: string;
  type: string;
  time: Date;
  message?: string;
  details?: string[];
  error?: string;
}

const EventLogSchema = new Schema<IMongooseEventLog>(
  {
    type: { type: String, required: true },
    time: { type: Date, required: true },
    message: String,
    details: [String],
    error: String,
  },
  {
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  },
);

const MongoEventLog = mongoose.model<IMongooseEventLog>('events', EventLogSchema);

export async function getAllEvents() {
  const data = await MongoEventLog.find();
  return data;
}

export async function getEventById(id: string) {
  const data = await MongoEventLog.findById(id);
  return data;
}

export function prettifyEvent(mongooseEventLogs: IMongooseEventLog) {
  const eventLog: IEventLog = {
    id: mongooseEventLogs._id.toString(),
    type: mongooseEventLogs.type,
    time: mongooseEventLogs.time,
  };
  if (mongooseEventLogs.message) eventLog.message = mongooseEventLogs.message;
  if (mongooseEventLogs.details) eventLog.details = mongooseEventLogs.details;
  if (mongooseEventLogs.error) eventLog.error = mongooseEventLogs.error;
  return eventLog;
}

class Logger {
  private _websocket: WebSocket | undefined;
  constructor(private logLevel = 3) {
    attachDebugMethod('logger', this);
  }

  private getTime() {
    const date = moment.utc().toDate();
    const text = moment(date).format('MMMM Do YYYY, HH:mm:ss');
    return { date, text };
  }

  async saveToDataBase(type: string, time: Date, message?: string, details?: string[], error?: string) {
    const schema = new MongoEventLog({
      type,
      time,
    });

    if (message) schema.message = message;
    if (details) schema.details = details;
    if (error) schema.error = error;

    try {
      await schema.save();
      if (this._websocket) {
        const clients = this._websocket.getClientByRoles('admin');
        for (const client of clients) {
          client.emit('admin-event-log-report', prettifyEvent(schema));
        }
      }
    } catch (error) {
      console.error(`Cannot store error`, error);
    }
    return schema;
  }

  _setWebSocket(webSocket: WebSocket) {
    this._websocket = webSocket;
  }

  setLogLevel(logLevel = 2) {
    this.logLevel = logLevel;
  }

  debug(message: string, ...optionalParams: any[]) {
    if (!IS_DEV) return;
    const { text } = this.getTime();
    const args = [yellow(`${text}`), white('[debug]'), message, ...optionalParams].filter(a => a);
    console.debug.apply(null, args);
  }

  log(message: string, ...optionalParams: any[]) {
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), white('[log]'), message, ...optionalParams].filter(a => a);
    console.log.apply(null, args);
    if (this.logLevel > 4) {
      this.saveToDataBase('log', date, message, optionalParams);
    }
  }

  info(message: string, ...optionalParams: any[]) {
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), yellow('[INFO]'), message, ...optionalParams].filter(a => a);
    console.info.apply(null, args);
    if (this.logLevel > 3) {
      this.saveToDataBase('Info', date, message, optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]) {
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), red('[WARN]'), message, ...optionalParams].filter(a => a);
    console.warn.apply(null, args);
    if (this.logLevel > 2) {
      this.saveToDataBase('warn', date, message, optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]) {
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), red('[ERROR]'), message, ...optionalParams].filter(a => a);
    console.error.apply(null, args);
    if (this.logLevel > 1) {
      this.saveToDataBase('error', date, message, optionalParams, new Error().stack);
    }
  }

  fatal(message: string, ...optionalParams: any[]) {
    const { date, text } = this.getTime();
    const args = [yellow(`${text}`), red('[FATAL]'), message, ...optionalParams].filter(a => a);
    console.error.apply(null, args);
    if (this.logLevel > 0) {
      this.saveToDataBase('fatal', date, message, optionalParams, new Error().stack);
    }
  }
}

export const logger = new Logger();
