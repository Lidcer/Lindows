import { Terminal } from '../apps/Terminal/Terminal';
import { TaskManager } from '../apps/TaskManager/TaskManager';
import { AccountManager } from '../apps/AccountManager/AccountManager';
import { Lype } from '../apps/Lype/Lype';
import { MouseProperties } from '../apps/MouseProperties/MouseProperties';
import { GroupViewer } from '../apps/GroupViewer/GroupViewer';
import React from 'react';
import { IManifest, BaseWindow, MessageBox, AdminPromp } from '../apps/BaseWindow/BaseWindow';
import { internal } from '../services/internals/Internal';
import { WebExplorer } from '../apps/WebExplorer/WebExplorer';
import { VirtualCreate } from '../apps/VirtualCreate/VirtualCrate';
import { attachToWindowIfDev, isDev } from './requests';
import { AnApp } from '../apps/AnApp/AnApp';
import { IDELide } from '../apps/IDE-Lide.ts/IDE-Lide';
import { SnakeGame } from '../apps/SnakeGame/SnakeGame';
import { FileExplorer } from '../apps/FileExplorer/FileExplorer';
import { MoneyClicker } from '../apps/MoneyClicker/MoneyClicker';
import {
  everyone,
  FileSystemDirectory,
  FileSystemFile,
  isDirectory,
  isNameValid,
  StringSymbol,
} from '../utils/FileSystemDirectory';

export declare type ReactGeneratorFunction = (id: number, props?: any) => JSX.Element;

export interface AppDescription {
  manifest: IManifest;
  app: ReactGeneratorFunction;
  showInTaskBar: boolean;
}

export async function installApp(appWindow: BaseWindow | any, name: string, showInTaskBar = false, owner = everyone) {
  if (!appWindow) {
    throw new Error('Failed to install, passed empty app!');
  }

  if (!appWindow.manifest) {
    throw new Error('Cannot install without manifest');
  }
  name = appWindow.manifest.launchName || name;

  if (!name) {
    throw new Error('Missing launch name');
  }
  const validName = isNameValid(name);
  if (!validName.valid) {
    throw new Error(validName.reason);
  }
  if (!/^[a-z]+$/gi.test(name)) {
    throw new Error(`Invalid name: ${name}`);
  }

  const system = internal.processor.symbol;
  let apps: FileSystemDirectory;
  try {
    apps = internal.fileSystem.root.getDirectory('bin', system).getDirectory('apps', system);
  } catch (error) {
    throw new Error('Corrupted file system');
  }

  const contents = apps.contents(system);
  const existing = contents.find(c => c.name.toLowerCase() == name.toLowerCase());
  if (existing && !isDirectory(existing)) {
    throw new Error('Command already installed!');
  } else if (existing) {
    throw new Error('Failed to install command under this name!');
  }

  const file = await apps.createFile(name, 'lindowApp', undefined, owner);
  const Element = appWindow as any;
  const app = (id: number, props?: any) => (
    <Element key={id} id={id} onlyOne={!!appWindow.onlyOne} launchFile={file} {...props}></Element>
  );
  const appDescription: AppDescription = {
    manifest: appWindow.manifest,
    app,
    showInTaskBar,
  };
  file.setContent(appDescription, owner);
}

export function installSystemCommand(
  appWindow: BaseWindow | any,
  name: string,
  showInTaskBar: boolean,
  system: StringSymbol,
) {
  if (!system.requals(internal.processor.symbol)) {
    throw new Error('You do not have admin permission to install this command');
  }
  return installApp(appWindow, name, showInTaskBar, system);
}

export function uninstallCommand(name: string, owner = everyone) {
  const system = internal.processor.symbol;
  let apps: FileSystemDirectory;
  try {
    apps = internal.fileSystem.root.getDirectory('bin', system).getDirectory('apps', system);
  } catch (error) {
    throw new Error('Corrupted file system');
  }
  const contents = apps.contents(system);

  const existing = contents.find(c => c.name.toLowerCase() == name.toLowerCase());
  if (!existing) {
    throw new Error('App is not installed!');
  }
  if (!isDirectory(existing)) {
    existing.deleteFile(owner);
  } else {
    throw new Error('File is a directory');
  }
}

export function launchApp(appName: string, flags?: string) {
  const app = appConstructorGenerator(appName);
  if (app) {
    internal.processor.addApp(app, appName, flags);
    return true;
  }
  return false;
}

export function appConstructorGenerator(appName: string) {
  const system = internal.processor.symbol;
  let apps: FileSystemDirectory;
  try {
    apps = internal.fileSystem.root.getDirectory('bin', system).getDirectory('apps', system);
  } catch (error) {
    throw new Error('Corrupted file system');
  }
  const object = apps.getFile<AppDescription>(appName, system);
  if (object) {
    try {
      const app = object.getContent(system).app;
      return app;
    } catch (error) {
      DEV && console.error(error);
      return null;
    }
  }
  return null;
}

export async function installPreInstalledApps() {
  await installApp(MessageBox, MessageBox.manifest.launchName, false, internal.processor.symbol);
  await installApp(Terminal, Terminal.manifest.launchName, true, internal.processor.symbol);
  await installApp(TaskManager, TaskManager.manifest.launchName, true, internal.processor.symbol);
  await installApp(SnakeGame, SnakeGame.manifest.launchName, true, internal.processor.symbol);
  await installApp(MoneyClicker, MoneyClicker.manifest.launchName, true, internal.processor.symbol);
  if (!STATIC) {
    await installApp(AccountManager, AccountManager.manifest.launchName, true, internal.processor.symbol);
    await installApp(Lype, Lype.manifest.launchName, true, internal.processor.symbol);
    await installApp(GroupViewer, GroupViewer.manifest.launchName, true, internal.processor.symbol);
  }
  await installApp(FileExplorer, FileExplorer.manifest.launchName, true, internal.processor.symbol);
  await installApp(WebExplorer, WebExplorer.manifest.launchName, true, internal.processor.symbol);

  await installApp(VirtualCreate, VirtualCreate.manifest.launchName, true, internal.processor.symbol);

  await installApp(MouseProperties, MouseProperties.manifest.launchName, true, internal.processor.symbol);
  await installApp(IDELide, IDELide.manifest.launchName, true, internal.processor.symbol);
  if (DEV) {
    await installApp(AnApp, AnApp.manifest.launchName, true, internal.processor.symbol);
  }
}

export function allInstalledApps(): AppDescription[] {
  let apps: FileSystemDirectory;
  const system = internal.processor.symbol;
  try {
    apps = internal.fileSystem.root.getDirectory('bin', system).getDirectory('apps', system);
  } catch (error) {
    DEV && console.error(error);
    return [];
  }
  const contents = apps.contents(system).filter(f => !isDirectory(f)) as FileSystemFile[];
  const lindowAppsFiles = contents.filter(f => f.getType(system) === 'lindowApp') as FileSystemFile<AppDescription>[];
  const lindowsApps = lindowAppsFiles.map(f => f.getContent(system));
  return lindowsApps;
}

attachToWindowIfDev('launchApp', launchApp);
