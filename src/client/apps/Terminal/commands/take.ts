import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { launchApp } from '../../../apps';
import { processor } from '../../../essential/processor';

export const COMMANDS = ['take'];

export class Take extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    const c = this.terminalCommand.command;
    if (this.terminalCommand.isArg('help')) {
      this.terminalCommand.content = [
        'raiseinternalexeption - throws error inside lidows core',
        'killall - kills all running processes',
      ].join('\n');

      this.terminalCommand.finish();
      return;
    } else if (this.terminalCommand.isArg('killall')) {
      const processes = processor.getProcesses();
      const size = processes.length;
      processor.getProcesses().forEach(app => {
        app.exit();
      });

      this.terminalCommand.content = `killed ${size} apps`;
      this.terminalCommand.finish();
    } else if (this.terminalCommand.isArg('raiseinternalexeption')) {
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
