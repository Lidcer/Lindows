import { Terminal, manifest as terminalManifest } from '../apps/Terminal/Terminal';
import { TaskManager, manifest as taskManagerManifest } from '../apps/TaskManager/TaskManager';
import { AccountManager, manifest as accountManagerManifest } from '../apps/AccountManager/AccountManager';
import { Lype, manifest as lypeManifest } from '../apps/Lype/Lype';
import { MouseProperties, manifest as MousePropertiesManifest } from '../apps/MouseProperties/MouseProperties';
import React from 'react';
import { IManifest } from '../apps/BaseWindow/BaseWindow';
import { services } from '../services/SystemService/ServiceHandler';
import { attachDebugMethod } from './requests';

export declare type ReactGeneratorFunction = (id: number, props?: any) => JSX.Element;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface AllApps {
  manifest: IManifest;
  app: ReactGeneratorFunction;
}

export const allApps: AllApps[] = [
  { manifest: terminalManifest, app: (id: number, props?: any) => <Terminal key={id} id={id} {...props}></Terminal> },
  {
    manifest: taskManagerManifest,
    app: (id: number, props?: any) => <TaskManager key={id} id={id} onlyOne={true} {...props}></TaskManager>,
  },
  {
    manifest: accountManagerManifest,
    app: (id: number, props?: any) => <AccountManager key={id} id={id} onlyOne={true} {...props}></AccountManager>,
  },
  {
    manifest: lypeManifest,
    app: (id: number, props?: any) => <Lype key={id} id={id} onlyOne={true} {...props}></Lype>,
  },

  {
    manifest: MousePropertiesManifest,
    app: (id: number, props?: any) => <MouseProperties key={id} id={id} onlyOne={true} {...props}></MouseProperties>,
  },
];

export function launchApp(appName: string) {
  const app = appConstructorGenerator(appName);
  if (app) {
    services.processor.addApp(app, appName);
    return true;
  }
  return false;
}
attachDebugMethod('launchApp', launchApp);

export function appConstructorGenerator(appName: string) {
  const object = allApps.find(a => a.manifest.launchName.toLowerCase() === appName.toLowerCase());
  if (object) {
    return object.app;
  }
  return null;
}
