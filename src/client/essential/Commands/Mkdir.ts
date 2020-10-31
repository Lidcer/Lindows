import { BaseCommand, ExecutionParameters } from "./BaseCommand";

export class MkDir extends BaseCommand {
  public static help = "Create directory";
  execute(parameters: ExecutionParameters) {
    const name = this.args.splice(1).join().trim();
    try {
      if (parameters && parameters.processor) {
        parameters.directory.createDirectory(name, parameters.processor.symbol);
      } else {
        parameters.directory.createDirectory(name);
      }
      this.finish("");
      return 0;
    } catch (error) {
      this.finish(error.message);
      return 1;
    }
  }
}
