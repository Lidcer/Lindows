import { DATA_BASE_TYPE, IS_DEV } from "../config";

export class Modifiable<M = any, S = any> {
  constructor(protected db: M | S) {}

  isMongo(_db: any): _db is M {
    return isMongo();
  }
  isMySql(_db: any): _db is S {
    return isMySql();
  }

  save(): this | Promise<this> {
    throw new Error("Method not implmiented");
  }

  remove(): Promise<void> {
    throw new Error("Method not implmiented");
  }

  protected toArray(text: string | string[]): string[] {
    if (text === undefined || text === null) return [];
    if (Array.isArray(text)) {
      return text;
    } else if (typeof text === "string") {
      try {
        const result = JSON.parse(text);
        return this.toArray(result);
      } catch (error) {
        if (IS_DEV) {
          console.error(text);
          throw error;
        } else {
          return [];
        }
      }
    }
    throw new Error(`Uknown type ${typeof text}`);
  }
  protected fromArray(text: string | string[]): string {
    if (text === undefined || text === null) return "";
    if (Array.isArray(text)) {
      try {
        const result = JSON.stringify(text);
        return this.fromArray(result);
      } catch (error) {
        if (IS_DEV) {
          console.error(text);
          throw error;
        } else {
          return "";
        }
      }
    } else if (typeof text === "string") {
      return text;
    }
    throw new Error(`Uknown type ${typeof text}`);
  }
}

export function isMongo() {
  return DATA_BASE_TYPE === "mongoDB";
}

export function isMySql() {
  return DATA_BASE_TYPE === "mySql";
}

export interface ID {
  id: number;
}
