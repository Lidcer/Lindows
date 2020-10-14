import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { services } from '../../services/SystemService/ServiceHandler';
import { isDirectory, FileSystemDirectory, FileSystemFile } from '../../utils/FileSystemDirectory';

export class TakeCommand extends BaseCommand {
  public static help = ['killall, raiseinternalexception'].join('\n');
  execute() {
    const system = services.processor.symbol;
    if (this.hasArg('help')) {
      const content = [
        'raiseinternalexception - throws error inside lindows core',
        'killall - kills all running processes',
      ].join('\n');

      this.onFinish(content);
      return;
    } else if (this.hasArg('killall')) {
      const processes = services.processor.processes;
      const size = processes.length;
      services.processor.processes.forEach(app => {
        app.exit();
      });

      this.onFinish(`killed ${size} apps`);
    } else if (this.hasArg('raiseinternalexception')) {
      this.onFinish('done');
      setTimeout(() => {
        throw new Error(`Thrown by command ${this.args[0]}`);
      }, 0);
    } else {
      const c = this.args[0];
      this.onFinish(`${c}: missing operand\n Try '${c} help' for more information.`);
    }
  }
  interrupt() {}
}

/*
import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { services } from '../../../services/SystemService/ServiceHandler';

export const COMMANDS = ['take'];

export class Take extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    const c = this.terminalCommand.command;
    if (this.terminalCommand.isArg('help')) {
      this.terminalCommand.content = [
        'raiseinternalexception - throws error inside lindows core',
        'killall - kills all running processes',
      ].join('\n');

      this.terminalCommand.finish();
      return;
    } else if (this.terminalCommand.isArg('killall')) {
      const processes = services.processor.processes;
      const size = processes.length;
      services.processor.processes.forEach(app => {
        app.exit();
      });

      this.terminalCommand.content = `killed ${size} apps`;
      this.terminalCommand.finish();
    } else if (this.terminalCommand.isArg('raiseinternalexception')) {
      this.terminalCommand.content = 'killing...';
      this.terminalCommand.finish();
      throw 'Throwing';
    } else {
      this.terminalCommand.content = `${c}: missing operand\n Try '${c} help' for more information.`;
      this.terminalCommand.finish();
    }
  }
  public onTab(input: string) {
    return [];
  }
  public interrupt() {
    this.terminalCommand.finish();
  }
}


*/
