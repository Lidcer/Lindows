import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { internal } from '../../services/SystemService/ServiceHandler';
import { isDirectory, FileSystemDirectory, FileSystemFile, StringSymbol } from '../../utils/FileSystemDirectory';

export class Cat extends BaseCommand {
  public static help = 'get file contents';
  execute(parameters: ExecutionParameters) {
    const fileName = this.args.splice(1).join().trim();
    const contents = parameters.directory.contents(internal.processor.symbol);
    const foundFile = contents.find(f => !isDirectory(f) && f.name === fileName) as FileSystemFile;
    if (!foundFile) {
      this.finish('No such file');
      return 1;
    } else {
      const content = foundFile.getContent(internal.processor.symbol);
      try {
        const result = content.toString();
        this.finish(result);
      } catch (error) {
        this.finish('Cannot get content of this file');
        return 1;
      }
    }

    return 0;
  }

  listDirectoryContent(directory: FileSystemDirectory) {
    const contents = directory.contents(internal.processor.symbol);
    const names = contents.map(d => (isDirectory(d) ? `|${d.name}|` : d.name));
    return names.join(' ');
  }
}
