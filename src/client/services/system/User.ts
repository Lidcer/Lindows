import { random } from "lodash";
import { sanitizeName, StringSymbol } from "../../utils/FileSystemDirectory";
import { BaseService, SystemServiceStatus } from "../internals/BaseSystemService";
import { Internal } from "../internals/Internal";

const internal = new WeakMap<User, Internal>();
export class User extends BaseService {
  private _status = SystemServiceStatus.Uninitialized;
  private rawData = {};
  private _userName: string;

  constructor(_internal: Internal) {
    super();
    internal.set(this, _internal);
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;

    const start = async () => {
      const regKey = "_defaultUser";
      this._status = SystemServiceStatus.Starting;
      const int = internal.get(this);
      const reg = int.system.registry.getRootItem(regKey, int.systemSymbol);
      if (reg && typeof reg.data === "string") {
        this._userName = reg.data;
      } else {
        this._userName = `Guest${random(4)}`;
        await int.system.registry.setRootItem(regKey, this._userName, int.systemSymbol);
      }
      const userDir = int.fileSystem.home.getDirectory(this._userName, int.systemSymbol);
      if (!userDir) {
        await int.fileSystem.createUserDirectory(this._userName);
      }
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error("Service has already been destroyed");
      this._status = SystemServiceStatus.Destroyed;
      internal.delete(this);
    };

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }
  get userDirectory() {
    const int = internal.get(this);
    return int.fileSystem.home.getDirectory(this.userName);
  }

  get userName() {
    return this._userName;
  }
  get cleanUserName() {
    return sanitizeName(this._userName);
  }

  get userSymbol() {
    return new StringSymbol(this._userName);
  }

  status() {
    return this._status;
  }
}
