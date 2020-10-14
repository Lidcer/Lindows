import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { services } from '../../services/SystemService/ServiceHandler';
import { FileSystemDirectory } from '../../utils/FileSystemDirectory';

export class CdCommand extends BaseCommand {
  public static help = 'list directory';
  execute(parameters: ExecutionParameters) {
    let path = this.args.splice(1).join().trim();
    if (path) {
      if (path.startsWith('/root')) {
        path = `root/${path.slice(5)}`;
      } else if (path.startsWith('/') || path.startsWith('\\')) {
        path = `root/${path}`;
      }

      const directory = services.fileSystem.parseDirectorRelative(parameters.directory, path);
      if (!directory) {
        return this.onFinish('No such file or directory');
      } /*else if (directory.getPermission(owner)) {

      } */ else {
        parameters.directory = directory;
        return this.onFinish('');
      }
    }
    if (!parameters.directory) {
      return this.onFinish('Directory was not provided');
    }
    this.onFinish('');
  }

  listDirectoryContent(directory: FileSystemDirectory) {
    const contents = directory.contents(services.processor.symbol);
    const names = contents.map(d => d.name);
    return names.join('\n');
  }

  interrupt() {}
}
