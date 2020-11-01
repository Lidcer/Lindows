import { Internal } from "./Internal";
import * as compress from "compress-str";
import {
  everyone,
  FileSystemContent,
  FileSystemDirectory,
  FileSystemPermissions,
  isDirectory,
  objectifyDirectory,
  parseDirectory,
  parseDirectoryOrFile,
  sanitizeName,
  StringSymbol,
} from "../../utils/FileSystemDirectory";
import { BaseService, SystemServiceStatus } from "./BaseSystemService";
import prettysize from "prettysize";
import { inIframe } from "../../utils/util";
import { random } from "lodash";

const fileSystemKey = "__fileSystem__";

const internal = new WeakMap<FileSystem, Internal>();

export class FileSystem extends BaseService {
  private _status = SystemServiceStatus.Uninitialized;
  private _root: FileSystemDirectory;
  private _home: FileSystemDirectory;
  private saving = false;

  constructor(_internal: Internal) {
    super();
    internal.set(this, _internal);
    this._root = this.createRootSaveable();
  }

  private createRootSaveable = () => {
    const int = internal.get(this);
    const system = int.systemSymbol;
    return new FileSystemDirectory("root", system, async () => {
      if (inIframe()) {
        if (this.saving && int.broadcaster.status() === SystemServiceStatus.Ready) {
          const objected = objectifyDirectory(this._root, system);
          const string = JSON.stringify(objected);
          const compressed = await compress.gzip(string);
          int.broadcaster.emit("vm", { type: "request-store", origin, compressed });
          return;
        }
        return;
      }
      if (this.saving) {
        const objected = objectifyDirectory(this._root, system);
        const string = JSON.stringify(objected);
        const compressed = await compress.gzip(string);
        localStorage.setItem(fileSystemKey, compressed);
      }
      return;
    });
  };

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;
    const int = internal.get(this);
    const system = int.systemSymbol;

    const createRoot = async () => {
      this._root = this.createRootSaveable();

      let homeDirectory: FileSystemDirectory;

      const systemSymbol = system;
      const directories = [
        "bin",
        "boot",
        "dev",
        "etc",
        "home",
        "media",
        "mnt",
        "opt",
        "proc",
        "run",
        "sbin",
        "snap",
        "srv",
        "sys",
        "tmp",
        "usr",
      ];

      for (const directory of directories) {
        const createdDirectory = await this._root.createDirectory(directory, systemSymbol);
        if (directory === "home") {
          homeDirectory = createdDirectory;
          this._home = homeDirectory;
        }
        if (directory === "usr") {
          const bin = await createdDirectory.createDirectory("bin", systemSymbol);
          bin.createDirectory("cmd", systemSymbol);
          bin.createDirectory("apps", systemSymbol);
        }
        if (directory === "bin") {
          createdDirectory.createDirectory("cmd", systemSymbol);
          createdDirectory.createDirectory("apps", systemSymbol);
        }
      }
      //homeDirector.createDirectory(this.username());

      // const rawObjectDirectory = localStorage.getItem(fileSystemKey);
      // console.log(rawObjectDirectory);
      // if (rawObjectDirectory) {
      //   const objectDirectoryString = await compress.gzip(rawObjectDirectory);
      //   const directoryToParse = JSON.parse(objectDirectoryString);

      //   const populateHomeDirectory = async () => {
      //     if (directoryToParse) {
      //       for (const file of directoryToParse.contents) {
      //         parseDirectoryOrFile(homeDirectory, file, systemSymbol);
      //       }
      //     }
      //   };
      //   populateHomeDirectory();
      // }
    };

    const start = async () => {
      this._status = SystemServiceStatus.Starting;
      const int = internal.get(this);
      const system = int.systemSymbol;

      if (!inIframe()) {
        const fsString = localStorage.getItem(fileSystemKey);
        if (!fsString) {
          await createRoot();
        } else {
          try {
            const int = internal.get(this);
            const system = int.systemSymbol;
            const uncompressed = await compress.gunzip(fsString);
            const objectFolder = JSON.parse(uncompressed);
            for (const content of objectFolder.contents) {
              parseDirectory(this._root, content, system);
            }
            this._home = this._root.getDirectory("home", system);
            if (!this._home) {
              this._root.createDirectory("home", system);
            }
          } catch (error) {
            this._status = SystemServiceStatus.Failed;
            return;
            //DEV && console.error(error);
            //await createRoot();
          }
        }

        const objected = objectifyDirectory(this._root, system);
        const string = JSON.stringify(objected);
        const compressed = await compress.gzip(string);
        localStorage.setItem(fileSystemKey, compressed);
        this._status = SystemServiceStatus.Ready;
      } else {
        return new Promise<void>(async (resolve, reject) => {
          if (int.broadcaster.status() !== SystemServiceStatus.Ready) {
            this._status = SystemServiceStatus.Failed;
            return reject("Unable to communitace with vm");
          }
          const key = random(0, 9999999);
          const onData = async (data: any) => {
            if (data.key !== key) return;
            if (data && data.type === "response-data") {
              if (data.response) {
                try {
                  const int = internal.get(this);
                  const system = int.systemSymbol;
                  const uncompressed = await compress.gunzip(data.response);
                  const objectFolder = JSON.parse(uncompressed);
                  for (const content of objectFolder.contents) {
                    parseDirectory(this._root, content, system);
                  }
                  this._home = this._root.getDirectory("home", system);
                  if (!this._home) {
                    this._root.createDirectory("home", system);
                  }
                } catch (error) {
                  this._status = SystemServiceStatus.Failed;
                  return;
                }
              } else {
                await createRoot();
              }
              this._status = SystemServiceStatus.Ready;
              resolve();
            }
          };
          int.broadcaster.on("vm", onData);
          int.broadcaster.emit("vm", { type: "request-data", origin, key });
        });
      }
    };

    const destroy = () => {
      this.saving = false;
      if (this._status === SystemServiceStatus.Destroyed) throw new Error("Service has already been destroyed");
      this._status = SystemServiceStatus.Destroyed;
      internal.delete(this);
    };
    this.saving = true;
    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }

  parseDirectory(path: string, owner = everyone): FileSystemDirectory | null {
    path = path.replace(/\\/g, "/");
    const folders = path.split("/");
    let currentScanner = this.root;
    for (const folderName of folders) {
      if (currentScanner.name === folderName) {
        continue;
      } else {
        const contents = currentScanner.contents(owner);
        const find = contents.find(f => f.name === folderName);
        if (find && isDirectory(find)) {
          currentScanner = find;
        } else {
          return null;
        }
      }
    }
    try {
      currentScanner.contents(owner);
      return currentScanner;
    } catch (error) {
      return null;
    }
  }
  parseDirectorRelative(current: FileSystemDirectory, path: string, owner = everyone) {
    path = path.replace(/\\/g, "/");
    const split = path.split("/");
    if (path.startsWith("/")) {
      current = this.root;
    } else if (path.startsWith(".")) {
      /* do nothing */
    } else if (/^[a-z]/gi.test(path)) {
      path = `./${path}`;
    } else {
      return null;
    }

    let looking = split.shift();
    const int = internal.get(this);
    const system = int.systemSymbol;
    while (looking) {
      if (looking === "..") {
        const newDirectoryPath = current.path.split("/");
        newDirectoryPath.pop();
        const dir = this.parseDirectory(newDirectoryPath.join("/"), system);
        if (!dir) {
          return null;
        }
        current = dir;
      } else if (looking !== ".") {
        const dir = current.getDirectory(looking, system);
        if (!dir) {
          return null;
        }
        current = dir;
      }
      looking = split.shift();
    }
    return current;
  }
  status = () => {
    return this._status;
  };

  get root() {
    return this._root;
  }
  get home() {
    return this._home;
  }
  getUniqueName(target: FileSystemDirectory, name: string, owner: StringSymbol) {
    const names = target.contents(owner).map(f => f.name);
    let newName = name;
    let counter = 1;
    while (names.includes(newName)) {
      newName = `${name} (${++counter})`;
    }
    return newName;
  }

  // async saveHome() {
  //   const int = internal.get(this);
  //   const system = int.systemSymbol;
  //   const objectDir = objectifyDirectory(this.home, system);
  //   const stringified = JSON.stringify(objectDir);
  //   try {
  //     const compressed = await compress.gzip(stringified);
  //     localStorage.setItem(fileSystemKey, compressed);
  //   } catch (error) {
  //     DEV && console.error(error);
  //   }
  // }
  _setSaving(value: boolean) {
    this.saving = value;
  }

  async createUserDirectory(username: string, userSymbol: StringSymbol) {
    username = sanitizeName(username);
    const int = internal.get(this);
    const system = int.systemSymbol;

    const user = await this.home.createDirectory(username, system);
    user.setPermissionFor(system, userSymbol, FileSystemPermissions.ReadAndWrite);
    const userDirectories = ["Desktop", "Documents", "Downloads", "Music", "Pictures", "Videos"];
    for (const userDir of userDirectories) {
      user.createDirectory(userDir, userSymbol);
    }
    return user;
  }

  size(arg: FileSystemContent | number): string {
    if (typeof arg === "number") {
      return prettysize(arg, true);
    }
    try {
      const result = prettysize(arg.size, true);
      return result;
    } catch (error) {
      DEV && console.error(error);
      return "?";
    }
  }
}
