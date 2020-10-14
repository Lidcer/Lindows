import { BaseCommand, ExecutionParameters } from './BaseCommand';
import { services } from '../../services/SystemService/ServiceHandler';
import { isDirectory, FileSystemDirectory, FileSystemFile } from '../../utils/FileSystemDirectory';
import { launchApp } from '../apps';

export class StartCommand extends BaseCommand {
  public static help = 'appname [flags...]';
  execute() {
    const appName = this.args[1];
    const flags = this.args.slice(2).join(' ');
    if (launchApp(appName, flags)) {
      this.onFinish(`App ${appName} launched`);
    } else {
      this.onFinish(`Unable to launch ${appName}`);
    }
  }
  interrupt() {}
}
