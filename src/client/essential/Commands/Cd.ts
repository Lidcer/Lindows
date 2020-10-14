import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { internal } from '../../services/SystemService/ServiceHandler';
import { FileSystemDirectory, isDirectory } from '../../utils/FileSystemDirectory';

export class Cd extends BaseCommand {
  execute(parameters: ExecutionParameters) {
    let path = this.args.splice(1).join().trim();
    if (path) {
      if (path.startsWith('/root')) {
        path = `root/${path.slice(5)}`;
      } else if (path.startsWith('/') || path.startsWith('\\')) {
        path = `root/${path}`;
      }

      const directory = internal.fileSystem.parseDirectorRelative(parameters.directory, path);
      if (!directory) {
        this.finish('No such file or directory');
        return 1;
      } /*else if (directory.getPermission(owner)) {

      } */ else {
        parameters.directory = directory;
        this.finish('');
        return 0;
      }
    }
    if (!parameters.directory) {
      this.finish('Directory was not provided');
      return 1;
    }
    this.finish('');
    return 0;
  }

  listDirectoryContent(directory: FileSystemDirectory) {
    const contents = directory.contents(internal.processor.symbol);
    const names = contents.map(d => d.name);
    return names.join('\n');
  }

  suggest(entry: string, index: number, fullEntry: string, directory?: FileSystemDirectory) {
    if (!directory) return [];
    const content = directory.contents(internal.processor.symbol);
    const directories = content.filter(c => isDirectory(c)).map(f => f.name);
    return directories;
  }
}
