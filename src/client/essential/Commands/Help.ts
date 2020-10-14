import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { internal } from '../../services/SystemService/ServiceHandler';
import { isDirectory, FileSystemDirectory, FileSystemFile } from '../../utils/FileSystemDirectory';

export class HelpCommand extends BaseCommand {
  public static help = 'shows help message';
  execute() {
    const system = internal.processor.symbol;
    const directories = internal.fileSystem.root.contents(system);
    const bin = directories.find(b => isDirectory(b) && b.name === 'bin') as FileSystemDirectory;
    if (!bin) throw new Error('Corrupted file system');
    const contents = bin.contents(system);
    const files = contents.filter(c => !isDirectory(c)) as FileSystemFile[];
    const helps: string[] = [];
    for (const file of files) {
      const command = file.getContent(system) as new () => BaseCommand;
      const helpMessage = (command as any).help as string;
      if (helpMessage && typeof helpMessage === 'string') {
        helps.push(`${file.name} ${helpMessage}`);
      }
    }
    this.finish(helps.join('\n'));
    return 0;
  }
}
