import { IWindow, IBounds, BaseWindow } from '../BaseWindow/BaseWindow';
import { BaseCommand } from './commands/BaseCommand';
import { TerminalCommand } from './TerminalCommand';

//Commands
import * as neofetch from './commands/leofetch';
import * as terminal from './commands/terminal';
import * as taskManager from './commands/taskManager';
import * as take from './commands/take';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface Commands {
  commands: string[];
  object: (tr: TerminalCommand) => BaseCommand;
}

export const COMMANDS: Commands[] = [
  { commands: neofetch.COMMANDS, object: tr => new neofetch.Leofetch(tr) },
  { commands: terminal.COMMANDS, object: tr => new terminal.Terminal(tr) },
  { commands: taskManager.COMMANDS, object: tr => new taskManager.TaskManager(tr) },
  { commands: take.COMMANDS, object: tr => new take.Take(tr) },
];

export function onTerminalCommand(options: IWindow, bounds: IBounds, entry: string, iTerminal: BaseWindow) {
  const args = entry.replace(/ \s/g, '').split(' ');
  const command = args.shift();
  const commandClass = COMMANDS.find(o => o.commands.find(c => c.toLowerCase() === command.toLowerCase()));
  const tr = new TerminalCommand(entry, options, bounds, iTerminal);

  if (commandClass) {
    setTimeout(() => {
      const command = commandClass.object(tr);
      command.onStart();
    });
  } else {
    setTimeout(() => {
      tr.content = `${command}: command not found`;
      tr.finish();
    });
  }
  return tr;
}

export function onTab(entry: string) {
  const tr = new TerminalCommand(entry, undefined, undefined);
  const args = entry.replace(/ \s/g, '').split(' ');
  const command = args.shift();
  const commandClass = COMMANDS.find(o => o.commands.find(c => c.toLowerCase() === command.toLowerCase()));

  if (commandClass) {
    const command = commandClass.object(tr);
    const suggestion = args.length > 1 ? args[args.length - 1] : '';
    return command.onTab(suggestion);
  } else {
    return [];
  }
}
