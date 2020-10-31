import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { internal } from '../../services/internals/Internal';
import { getCommand } from './CommandHandler';
import { AdminPromp } from '../../apps/BaseWindow/BaseWindow';
// import { Sudo } from './SudoHelperApp';

export class Sudo extends BaseCommand {
  public static help = 'shows help message';
  async execute(obj: ExecutionParameters) {
    if (this.args.length < 1) {
      this.finish(`${this.args[0]} command`);
      return 1;
    }
    if (!obj) {
      obj.width = 0;
      obj.height = 0;
      obj.directory = internal.fileSystem.root;
    }

    const next = this.originalText.split(' ')[1];
    const Command = getCommand(next);
    if (!Command) {
      this.finish(`No such command ${next}`);
      return 1;
    }

    if (!obj.processor) {
      const result = await AdminPromp.requestAdmin({
        freeze: () => {},
        unFreeze: () => {},
      } as any);
      if (result) {
        obj.processor = internal.processor;
      } else {
        if (!this.finish) return;
        this.finish(`Administrator privileges was not obtained}`);
        return 1;
      }
    }

    const arrayCommands = this.originalText.split(' ');
    arrayCommands.shift();
    const commandToExecute = arrayCommands.join(' ');
    const newCommands = new Command(commandToExecute);
    newCommands.finish = this.finish;
    newCommands.addHistory = this.addHistory;
    return newCommands.execute(obj);
  }
}
