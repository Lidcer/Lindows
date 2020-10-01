import { FileSystemDirectory, StringSymbol } from '../../utils/FileSystemDirectory';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { BrowserStorage } from './BrowserStorageSystem';


const system = new WeakMap<FileSystem, StringSymbol>() 
export class FileSystem extends BaseSystemService {
  private _status = SystemServiceStatus.Uninitialized;
  private root: FileSystemDirectory;

  constructor(private browserStorage: BrowserStorage, systemSymbol: StringSymbol) {
    super();
    this.root = new FileSystemDirectory('root', systemSymbol);
    system.set(this, systemSymbol);
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error('Service has already been initialized');
    this._status = SystemServiceStatus.WaitingForStart;
    const systemSymbol = system.get(this);
    const createRoot = () => {
      const directories = [
        'bin', 'boot', 'dev',
        'etc', 'home', 'media', 
        'mnt', 'opt', 'proc',
        'run', 'sbin', 'snap', 'srv',
        'sys', 'tmp', 'usr']
        
        for (const directory of directories) {
          this.root.createDirectory(directory, systemSymbol);
        }
    };


    const start = () => {
      this._status = SystemServiceStatus.Starting;
      createRoot();
      this._status = SystemServiceStatus.Ready;
    }
  
    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error('Service has already been destroyed');
      this._status = SystemServiceStatus.Destroyed;
      system.delete(this);
    }

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    }
  }

  status = () => {
    return this._status;
  }
}

