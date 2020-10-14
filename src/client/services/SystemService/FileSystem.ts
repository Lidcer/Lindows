import {
  everyone,
  FileSystemContent,
  FileSystemDirectory,
  FileSystemFile,
  FileSystemPermissions,
  isDirectory,
  ObjectDirectory,
  objectifyDirectory,
  parseDirectory,
  parseDirectoryOrFile,
  sanitizeName,
  StringSymbol,
} from '../../utils/FileSystemDirectory';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { BrowserStorage } from './BrowserStorageSystem';
import { Processor } from './ProcessorSystem';
import prettysize from 'prettysize';

const fileSystemKey = '__FileSystem__';
const browserKeyDir = `__fileSystemKey:_users_`;
const system = new WeakMap<FileSystem, StringSymbol>();
export class FileSystem extends BaseSystemService {
  private _status = SystemServiceStatus.Uninitialized;
  private _root: FileSystemDirectory;
  private _home: FileSystemDirectory;
  private username: () => string;
  private deviceName: () => string;

  constructor(private browserStorage: BrowserStorage, processor: Processor) {
    super();
    this._root = new FileSystemDirectory('root', processor.symbol);
    system.set(this, processor.symbol);
    this.username = () => {
      return processor.username;
    };
    this.deviceName = () => {
      return processor.deviceName;
    };
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error('Service has already been initialized');
    this._status = SystemServiceStatus.WaitingForStart;

    const createRoot = () => {
      let homeDirectory: FileSystemDirectory;

      const systemSymbol = system.get(this);
      const directories = [
        'bin',
        'boot',
        'dev',
        'etc',
        'home',
        'media',
        'mnt',
        'opt',
        'proc',
        'run',
        'sbin',
        'snap',
        'srv',
        'sys',
        'tmp',
        'usr',
      ];

      for (const directory of directories) {
        const createdDirectory = this._root.createDirectory(directory, systemSymbol);
        if (directory === 'home') {
          homeDirectory = createdDirectory;
          this._home = homeDirectory;
        }
        if (directory === 'usr') {
          const bin = createdDirectory.createDirectory('bin', systemSymbol);
          bin.createDirectory('cmd', systemSymbol);
          bin.createDirectory('apps', systemSymbol);
        }
      }
      //homeDirector.createDirectory(this.username());

      const files = this.browserStorage.getItem<ObjectDirectory>(browserKeyDir);
      const populateHomeDirectory = () => {
        if (files) {
          for (const file of files.contents) {
            parseDirectoryOrFile(homeDirectory, file, systemSymbol);
          }
        } else {
          const user = homeDirectory.createDirectory(sanitizeName(this.username()), systemSymbol);
          const userSymbol = new StringSymbol(this.username());
          user.setPermissionFor(systemSymbol, userSymbol, FileSystemPermissions.ReadAndWrite);
          const userDirectories = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'];
          for (const userDir of userDirectories) {
            user.createDirectory(userDir, userSymbol);
          }

          const objectDir = objectifyDirectory(homeDirectory, systemSymbol);
          this.browserStorage.setItem(browserKeyDir, objectDir).catch(console.error);
        }
      };
      populateHomeDirectory();
    };

    const start = () => {
      this._status = SystemServiceStatus.Starting;
      createRoot();
      this._status = SystemServiceStatus.Ready;
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error('Service has already been destroyed');
      this._status = SystemServiceStatus.Destroyed;
      system.delete(this);
    };

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }

  parseDirectory(path: string, owner = everyone): FileSystemDirectory | null {
    path = path.replace(/\\/g, '/');
    const folders = path.split('/');
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
    path = path.replace(/\\/g, '/');
    const split = path.split('/');
    if (path.startsWith('/')) {
      current = this.root;
    } else if (path.startsWith('.')) {
      /* do nothing */
    } else if (/^[a-z]/gi.test(path)) {
      path = `./${path}`;
    } else {
      return null;
    }

    let looking = split.shift();
    const systemSymbol = system.get(this);
    while (looking) {
      if (looking === '..') {
        const newDirectoryPath = current.path.split('/');
        newDirectoryPath.pop();
        const dir = this.parseDirectory(newDirectoryPath.join('/'), systemSymbol);
        if (!dir) {
          return null;
        }
        current = dir;
      } else if (looking !== '.') {
        const dir = this.getDirectoryInDirectory(current, looking, systemSymbol);
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

  get cleanName() {
    return sanitizeName(this.username());
  }

  get root() {
    return this._root;
  }
  get home() {
    return this._home;
  }
  getDirectoryInDirectory(target: FileSystemDirectory, name: string, owner: StringSymbol) {
    const contents = target.contents(owner);
    return contents.find(c => isDirectory(c) && c.name === name) as FileSystemDirectory | undefined;
  }
  getFileInDirectory(target: FileSystemDirectory, name: string, owner: StringSymbol) {
    const contents = target.contents(owner);
    return contents.find(c => !isDirectory(c) && c.name === name) as FileSystemFile | undefined;
  }
  get userDirectory() {
    const sys = system.get(this);
    return this.getDirectoryInDirectory(this.home, this.cleanName, sys);
  }
  get userSymbol() {
    return new StringSymbol(this.username());
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

  saveHome() {
    const systemSymbol = system.get(this);
    const objectDir = objectifyDirectory(this.home, systemSymbol);
    this.browserStorage.setItem(browserKeyDir, objectDir).catch(console.error);
  }
  size(arg: FileSystemContent | number): string {
    if (typeof arg === 'number') {
      return prettysize(arg, true);
    }
    try {
      const result = prettysize(arg.size, true);
      return result;
    } catch (error) {
      DEVELOPMENT && console.error(error);
      return '?';
    }
  }
}
