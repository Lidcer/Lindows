import { FileSystemDirectory, FileSystemPermissions, ObjectDirectory, objectifyDirectory, parseDirectory, parseDirectoryOrFile, sanitizeName, StringSymbol } from '../../utils/FileSystemDirectory';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { BrowserStorage } from './BrowserStorageSystem';
import { Processor } from './ProcessorSystem';


const fileSystemKey = '__FileSystem__';
let system = new WeakMap<FileSystem, StringSymbol>() 
export class FileSystem extends BaseSystemService {
  private _status = SystemServiceStatus.Uninitialized;
  private root: FileSystemDirectory;
  private username: () => string;
  private deviceName: () => string;

  constructor(private browserStorage: BrowserStorage, processor: Processor) {
    super();
    this.root = new FileSystemDirectory('root', processor.symbol);
    system.set(this, processor.symbol);
    this.username = () => {
      return processor.username;
    }
    this.deviceName = () => {
      return processor.deviceName;
    }
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error('Service has already been initialized');
    this._status = SystemServiceStatus.WaitingForStart;
    
    
    const createRoot = () => {
      
      let homeDirectory: FileSystemDirectory; 

      const systemSymbol = system.get(this);
      console.log(systemSymbol)
      const directories = [
        'bin', 'boot', 'dev',
        'etc', 'home', 'media', 
        'mnt', 'opt', 'proc',
        'run', 'sbin', 'snap', 'srv',
        'sys', 'tmp', 'usr']
        
        for (const directory of directories) {
          const createdDirectory = this.root.createDirectory(directory, systemSymbol);
          if (directory === 'home') {
            homeDirectory = createdDirectory;
          }
        }
        //homeDirector.createDirectory(this.username());
        const browserKeyDir = `__fileSystemKey:_users_`
        const files = this.browserStorage.getItem<ObjectDirectory>(browserKeyDir)
        const populateHomeDirectory = () => {
          if (files) {
            for (const file of files.contents) {
              parseDirectoryOrFile(homeDirectory, file, systemSymbol);
            }
          } else {
            const user = homeDirectory.createDirectory(sanitizeName(this.username()), systemSymbol);
            const userSymbol = new StringSymbol(this.username());
            user.setPermissionFor(systemSymbol, userSymbol, FileSystemPermissions.ReadAndWrite)
            const userDirectories = [
              'Desktop', 'Documents', 'Downloads',
              'Music', 'Pictures', 'Videos'
            ]
            for (const userDir of userDirectories) {
              user.createDirectory(userDir, userSymbol);
            }

            const objectDir = objectifyDirectory(homeDirectory, systemSymbol);
            this.browserStorage.setItem(browserKeyDir, objectDir).catch(console.error);
          }
        }
        populateHomeDirectory();

        
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