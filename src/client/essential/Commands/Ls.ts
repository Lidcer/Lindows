import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { services } from '../../services/SystemService/ServiceHandler';
import { isDirectory, FileSystemDirectory, FileSystemFile, StringSymbol } from '../../utils/FileSystemDirectory';

export class LsCommand extends BaseCommand {
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
        const text = this.listDirectoryContent(directory);
        return this.onFinish(text);
      }
    }
    if (!parameters.directory) {
      return this.onFinish('Directory was not provided');
    }
    this.onFinish(this.listDirectoryContent(parameters.directory));
  }

  listDirectoryContent(directory: FileSystemDirectory) {
    const contents = directory.contents(services.processor.symbol);
    const names = contents.map(d => d.name);
    return names.join('\n');
  }

  interrupt() {}
}
