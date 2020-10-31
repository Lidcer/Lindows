import { BaseCommand, ExecutionParameters } from "./BaseCommand";
import { internal } from "../../services/internals/Internal";
import { isDirectory, FileSystemDirectory, FileSystemFile, StringSymbol } from "../../utils/FileSystemDirectory";

export class LsCommand extends BaseCommand {
  public static help = "list directory";
  execute(parameters: ExecutionParameters) {
    let path = this.args.splice(1).join().trim();
    if (path) {
      if (path.startsWith("/root")) {
        path = `root/${path.slice(5)}`;
      } else if (path.startsWith("/") || path.startsWith("\\")) {
        path = `root/${path}`;
      }

      const directory = internal.fileSystem.parseDirectorRelative(parameters.directory, path);
      if (!directory) {
        this.finish("No such file or directory");
        return 1;
      } /*else if (directory.getPermission(owner)) {

      } */ else {
        const text = this.listDirectoryContent(directory);
        this.finish(text);
        return 0;
      }
    }
    if (!parameters.directory) {
      this.finish("Directory was not provided");
      return 1;
    }
    this.finish(this.listDirectoryContent(parameters.directory));
    return 0;
  }

  listDirectoryContent(directory: FileSystemDirectory) {
    const contents = directory.contents(internal.systemSymbol);
    const names = contents.map(d => (isDirectory(d) ? `|${d.name}|` : d.name));
    return names.join(" ");
  }
}
