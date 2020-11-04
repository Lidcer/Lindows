import { Schema, Document } from "mongoose";
import { DataTypes, Model } from "sequelize";
import { mongoose, sql } from "./database";
import { logger } from "./EventLog";
import { ID, isMongo, isMySql, Modifiable } from "./modifiable";

interface TokenBlackList {
  token: string;
  deleteTime: number;
}

//MONGO
export interface IMongooseTokenBlackList extends Document, TokenBlackList {}

const VerificationSchema = new Schema<IMongooseTokenBlackList>(
  {
    token: { type: String, required: true },
    deleteTime: { type: Number, required: true },
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
      wtimeout: 1000,
    },
  },
);

interface SqlTokenBlackList extends TokenBlackList, ID {}
class TokenBlackListMySql extends Model<SqlTokenBlackList, TokenBlackList> implements TokenBlackList {
  public readonly id: number;
  public deleteTime: number;
  public token: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TokenBlackListMySql.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    deleteTime: { type: DataTypes.BIGINT, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize: sql, modelName: "blackListTokens" },
);

type TokenBlackListDbType = IMongooseTokenBlackList | TokenBlackListMySql;

const MongoTokenBlackList = mongoose.model<IMongooseTokenBlackList>("blackListTokens", VerificationSchema);

export class TokenBlackListModifiable
  extends Modifiable<IMongooseTokenBlackList, TokenBlackListMySql>
  implements TokenBlackList {
  get id() {
    if (this.isMongo(this.db)) {
      return this.db._id.toString();
    } else if (this.isMySql) {
      return this.db.id;
    }
  }
  get deleteTime() {
    return this.db.deleteTime;
  }
  set deleteTime(deleteTime: number) {
    this.db.deleteTime = deleteTime;
  }
  get token() {
    return this.db.token;
  }
  set token(token: string) {
    this.db.token = token;
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

export async function isTokenBlackListed(token: string): Promise<boolean> {
  if (isMongo()) {
    const result = await MongoTokenBlackList.findOne({ token });
    return !!result;
  } else if (isMySql()) {
    const result = await TokenBlackListMySql.findOne({
      where: {
        token,
      },
    });
    return !!result;
  }

  return false;
}

export async function addTokenToBlackList(token: string, deleteTime: number): Promise<void> {
  const doesExist = await isTokenBlackListed(token);
  if (doesExist) return;

  const tokenBlackList: TokenBlackList = {
    token,
    deleteTime,
  };

  if (isMongo()) {
    const schema = new MongoTokenBlackList(tokenBlackList);
    await schema.save();
    setUpAutoDelete(token, deleteTime);
  } else if (isMySql()) {
    const tokenBlackListMySql = await TokenBlackListMySql.create(tokenBlackList);
    await tokenBlackListMySql.save();
    setUpAutoDelete(token, deleteTime);
  }
}

export function setUpAutoDelete(token: string, time: number) {
  setTimeout(async () => {
    try {
      if (isMongo()) {
        const t = await MongoTokenBlackList.findOne({ token });
        if (t) {
          await t.remove();
        }
      } else if (isMySql()) {
        const t = await TokenBlackListMySql.findOne({ where: { token } });
        if (t) {
          await t.destroy();
        }
      }
    } catch (error) {
      logger.error("token deletion", error, `Auto delete token ${token} failed`);
    }
  }, time - Date.now());
}

export async function rubbishCollectTokens(): Promise<void> {
  if (isMongo()) {
    const tokens = await MongoTokenBlackList.find();
    for (const token of tokens) {
      if (token.deleteTime < Date.now()) {
        await token.remove();
      } else {
        setUpAutoDelete(token.token, token.deleteTime - Date.now());
      }
    }
  } else if (isMySql()) {
    const tokens = await TokenBlackListMySql.findAll();
    for (const token of tokens) {
      if (token.deleteTime < Date.now()) {
        await token.destroy();
      } else {
        setUpAutoDelete(token.token, token.deleteTime - Date.now());
      }
    }
  }
}
