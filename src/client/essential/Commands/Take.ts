import { BaseCommand } from './BaseCommand';
import { internal } from '../../services/internals/Internal';

export class Take extends BaseCommand {
  public static help = ['killall, raiseinternalexception'].join('\n');
  execute() {
    const system = internal.processor.symbol;
    if (this.hasArg('help')) {
      const content = [
        'raiseinternalexception - throws error inside lindows core',
        'killall - kills all running processes',
      ].join('\n');

      this.finish(content);
      return;
    } else if (this.hasArg('killall')) {
      const processes = internal.processor.processes;
      const size = processes.length;
      internal.processor.processes.forEach(app => {
        app.exit();
      });

      this.finish(`killed ${size} apps`);
    } else if (this.hasArg('raiseinternalexception')) {
      this.finish('done');
      setTimeout(() => {
        throw new Error(`Thrown by command ${this.args[0]}`);
      }, 0);
      return 0;
    } else {
      const c = this.args[0];
      this.finish(`${c}: missing operand\n Try '${c} help' for more information.`);
      return 1;
    }
  }
}
