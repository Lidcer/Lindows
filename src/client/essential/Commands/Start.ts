import { BaseCommand } from './BaseCommand';
import { launchApp } from '../apps';

export class Start extends BaseCommand {
  public static help = 'appname [flags...]';
  execute() {
    const appName = this.args[1];
    const flags = this.args.slice(2).join(' ');
    if (launchApp(appName, flags)) {
      this.finish(`App ${appName} launched`);
      return 0;
    } else {
      this.finish(`Unable to launch ${appName}`);
      return 1;
    }
  }
}
