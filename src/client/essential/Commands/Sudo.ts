import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { services } from '../../services/SystemService/ServiceHandler';
import { getCommand } from './CommandHandler';
import { AdminPromp } from '../../apps/BaseWindow/BaseWindow';
// import { Sudo } from './SudoHelperApp';

export class SudoCommand extends BaseCommand {
  public static help = 'shows help message';
  async execute(obj: ExecutionParameters) {
    if (this.args.length < 1) {
      return this.onFinish(`${this.args[0]} command`);
    }
    if (!obj) {
      obj.width = 0;
      obj.height = 0;
      obj.directory = services.fileSystem.root;
    }

    const next = this.originalText.split(' ')[1];
    const Command = getCommand(next);
    if (!Command) {
      return this.onFinish(`No such command ${next}`);
    }

    if (!obj.processor) {
      const result = await AdminPromp.requestAdmin({
        freeze: () => {},
        unFreeze: () => {},
      } as any);
      if (result) {
        obj.processor = services.processor;
      } else {
        return this.onFinish(`Administrator privileges was not obtained}`);
      }
    }

    const arrayCommands = this.originalText.split(' ');
    arrayCommands.shift();
    const commandToExecute = arrayCommands.join(' ');
    const newCommands = new Command(commandToExecute);
    newCommands.onFinish = this.onFinish;
    newCommands.onStatusUpdate = this.onStatusUpdate;
    newCommands.execute(obj);
  }
}
