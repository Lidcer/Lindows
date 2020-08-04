import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { launchApp } from '../../../essential/apps';

export const COMMANDS = ['taskmgr'];

export class TaskManager extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    launchApp('taskmgr');

    this.terminalCommand.finish();
  }
  public onTab(input: string) {
    return [];
  }
  public interrupt() {
    this.terminalCommand.finish();
  }
}
