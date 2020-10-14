import { services } from '../../services/SystemService/ServiceHandler';
import {
  everyone,
  FileSystemDirectory,
  FileSystemFile,
  isDirectory,
  isNameValid,
  StringSymbol,
} from '../../utils/FileSystemDirectory';
import { BaseCommand } from './BaseCommand';
import { CdCommand } from './Cd';
import { HelpCommand } from './Help';
import { LsCommand } from './Ls';
import { StartCommand } from './Start';
import { SudoCommand } from './Sudo';
import { TakeCommand } from './Take';
import { TestDelayCommand } from './TestDelayCommand';

export function installCommand(command: BaseCommand, name: string, owner = everyone) {
  const validName = isNameValid(name);
  if (!validName.valid) {
    throw new Error(validName.reason);
  }
  if (!/^[a-z]+$/gi.test(name)) {
    throw new Error('Invalid name');
  }

  const system = services.processor.symbol;
  const directories = services.fileSystem.root.contents(system);
  const bin = directories.find(b => isDirectory(b) && b.name === 'bin') as FileSystemDirectory;
  if (!bin) throw new Error('Corrupted file system');
  const contents = bin.contents(system);
  const existing = contents.find(c => c.name.toLowerCase() == name.toLowerCase());
  if (existing && !isDirectory(existing)) {
    throw new Error('Command already installed!');
  } else if (existing) {
    throw new Error('Failed to install command under this name!');
  }
  bin.createFile(name.toLowerCase(), 'lindowObject', command, owner);
}

export function installSystemCommand(command: BaseCommand | any, name: string, system: StringSymbol) {
  if (system.getHash !== services.processor.symbol.getHash) {
    throw new Error('You do not have admin permission to install this command');
  }
  return installCommand(command, name, system);
}

export function uninstallCommand(name: string, owner = everyone) {
  const system = services.processor.symbol;
  const directories = services.fileSystem.root.contents(system);
  const bin = directories.find(b => isDirectory(b) && b.name === 'bin') as FileSystemDirectory;
  if (!bin) throw new Error('Corrupted file system');
  const contents = bin.contents(system);
  const existing = contents.find(c => c.name.toLowerCase() == name.toLowerCase());
  if (!existing) {
    throw new Error('Command is not installed!');
  }
  if (!isDirectory(existing)) {
    existing.deleteFile(owner);
  } else {
    throw new Error('File is a directory');
  }
}

export function installPreInstalledCommands() {
  installSystemCommand(HelpCommand, 'help', services.processor.symbol);
  installSystemCommand(SudoCommand, 'sudo', services.processor.symbol);
  installSystemCommand(StartCommand, 'start', services.processor.symbol);
  installSystemCommand(LsCommand, 'ls', services.processor.symbol);
  installSystemCommand(CdCommand, 'cd', services.processor.symbol);
  if (DEVELOPMENT) {
    installSystemCommand(TestDelayCommand, 'devcounter', services.processor.symbol);
    installSystemCommand(TakeCommand, 'take', services.processor.symbol);
  }
}

export function getCommand(commandName: string) {
  const system = services.processor.symbol;
  const directories = services.fileSystem.root.contents(system);
  const bin = directories.find(b => isDirectory(b) && b.name === 'bin') as FileSystemDirectory;
  if (!bin) throw new Error('Corrupted file system');
  const contents = bin.contents(system);
  const command = contents.find(c => !isDirectory(c) && c.name === commandName) as FileSystemFile;
  if (command) {
    return command.getContent(system) as typeof BaseCommand;
  }
  return null;
}

export function executeCommand(text: string) {
 //
}
