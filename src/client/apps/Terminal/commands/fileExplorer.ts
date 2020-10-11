import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { launchApp } from '../../../essential/apps';

export const COMMANDS = ['fileexplorer'];

export class FileExplorerCommand extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    //launchApp('terminal');
    const admin = this.terminalCommand.args.find(a => a.toLowerCase() === 'admin');
    const root = this.terminalCommand.args.find(a => a.toLowerCase() === 'root');
    const args: string[] = [];
    if (admin) args.push('-admin');
    if (root) args.push('-path="root"');
    launchApp('file-explorer', args.join(' '));

    this.terminalCommand.finish();
  }
  public onTab(input: string) {
    return [];
  }
  public interrupt() {
    this.terminalCommand.finish();
  }
}
