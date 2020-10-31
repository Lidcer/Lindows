import { BaseCommand, ExecutionParameters } from "./BaseCommand";

export class EchoCommand extends BaseCommand {
  execute() {
    this.finish(this.commandEntry);
    return 0;
  }
}
