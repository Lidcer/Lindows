import { StringSymbol } from "../../utils/FileSystemDirectory";
import { BaseService, SystemServiceStatus } from "../internals/BaseSystemService";
import { Internal } from "../internals/Internal";

interface BaseRegistryData<T> {
  type: string;
  data: T;
  dateCreated: number;
  dateModified: number;
}

interface RegistryString extends BaseRegistryData<string> {
  type: "string";
  data: string;
}
interface RegistryNumber extends BaseRegistryData<number> {
  type: "number";
  data: number;
}
interface RegistryBoolean extends BaseRegistryData<boolean> {
  type: "boolean";
  data: boolean;
}
interface RegistryAny<T = any> extends BaseRegistryData<T> {
  type: "any";
  data: T;
}

interface RegistryData {
  type: string;
  data: any;
}

interface RegistryKeys {
  HKEY_USER: { [key: string]: { [key: string]: RegistryData } };
  HKEY_ROOT: { [key: string]: RegistryData };
}

const internal = new WeakMap<Registry, Internal>();
const registryKeys = new WeakMap<Registry, RegistryKeys>();
export class Registry extends BaseService {
  private _status = SystemServiceStatus.Uninitialized;
  private user = "";
  private userSymbol: StringSymbol;

  constructor(_internal: Internal) {
    super();
    internal.set(this, _internal);

    const registryKeysData: RegistryKeys = {
      HKEY_ROOT: {},
      HKEY_USER: {},
    };
    registryKeys.set(this, registryKeysData);
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;

    const start = () => {
      this._status = SystemServiceStatus.Starting;
      const fs = internal.get(this);
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error("Service has already been destroyed");
      this._status = SystemServiceStatus.Destroyed;
      internal.delete(this);
      registryKeys.delete(this);
    };

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }

  setUserItem(key: string, value: any) {
    const int = internal.get(this);
    const user = int.system.user.userName;
    if (!user) throw new Error("User is not found");
    const data = registryKeys.get(this);

    if (!data.HKEY_USER[user]) {
      data.HKEY_USER[user] = {};
    }

    const regData = this.getRegistryData(value, data.HKEY_USER[user][key]);
    data.HKEY_ROOT[key] = regData;
    return { ...regData };
  }

  getUserItemValue(key: string) {
    const reg = this.getUserItem(key);
    if (reg) {
      return reg.data;
    }
    return null;
  }

  getUserItem(key: string) {
    const int = internal.get(this);
    const user = int.system.user.userName;
    if (!user) throw new Error("User is not found");
    const data = registryKeys.get(this);

    if (!data.HKEY_USER[user]) {
      return null;
    }
    if (!data.HKEY_USER[user][key]) {
      return { ...data.HKEY_USER[user][key] };
    }
    return null;
  }

  async setRootItem<D = any>(key: string, value: D, system: StringSymbol) {
    const int = internal.get(this);
    if (!int.systemSymbol.equals(system)) throw new Error("Missing permissions");
    const data = registryKeys.get(this);
    const regData = this.getRegistryData(value, data.HKEY_ROOT[key]);
    data.HKEY_ROOT[key] = regData;
    return { ...regData };
  }
  getRootItem(key: string, system: StringSymbol) {
    const int = internal.get(this);
    if (!int.systemSymbol.equals(system)) throw new Error("Missing permissions");
    const data = registryKeys.get(this);
    if (data.HKEY_ROOT[key]) {
      return { ...data.HKEY_ROOT[key] };
    }
    return null;
  }

  _setUser(name: string, system: StringSymbol) {
    const int = internal.get(this);
    if (!int.systemSymbol.equals(system)) throw new Error("Unauthorized access");
    this.user = name;
    this.userSymbol = new StringSymbol(name);
  }

  private getRegistryData(data: string, registryData: Partial<BaseRegistryData<any>>): RegistryString;
  private getRegistryData(data: number, registryData: Partial<BaseRegistryData<any>>): RegistryNumber;
  private getRegistryData(data: boolean, registryData: Partial<BaseRegistryData<any>>): RegistryBoolean;
  private getRegistryData<D = any>(data: D, registryData: Partial<BaseRegistryData<any>>): RegistryAny<D>;
  private getRegistryData<D = any>(data: D, registryData: Partial<BaseRegistryData<D>> = {}) {
    const type = typeof data;
    const now = Date.now();
    if (!registryData.dateCreated) {
      registryData.dateCreated = now;
    }
    registryData.dateModified = now;

    switch (type) {
      case "boolean":
        const registryBoolean = (registryData as unknown) as RegistryBoolean;
        registryBoolean.type = "boolean";
        registryBoolean.data = !!data;
        return registryBoolean;
      case "string":
        const registryString = (registryData as unknown) as RegistryString;
        registryString.type = "string";
        registryString.data = (data as unknown) as string;
        return registryString;
      case "number":
        const registryNumber = (registryData as unknown) as RegistryNumber;
        registryNumber.type = "number";
        registryNumber.data = (data as unknown) as number;
        return registryNumber;
      default:
        const registryAny = (registryData as unknown) as RegistryAny<D>;
        registryAny.type = "any";
        registryAny.data = data;
        return registryAny;
    }
  }

  async save() {}

  status() {
    return this._status;
  }
}
