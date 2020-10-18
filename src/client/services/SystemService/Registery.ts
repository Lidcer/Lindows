import * as compress from 'compress-str';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { FileSystem } from './FileSystem';

export class Registery extends BaseSystemService {
  private _status = SystemServiceStatus.Uninitialized;

  constructor(private fileSystem: FileSystem) {
    super();
  }
}
