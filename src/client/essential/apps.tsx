import { Terminal } from '../apps/Terminal/Terminal';
import { TaskManager } from '../apps/TaskManager/TaskManager';
import { AccountManager} from '../apps/AccountManager/AccountManager';
import { Lype } from '../apps/Lype/Lype';
import { MouseProperties } from '../apps/MouseProperties/MouseProperties';
import { GroupViewer, } from '../apps/GroupViewer/GroupViewer';
import React from 'react';
import { IManifest, BaseWindow } from '../apps/BaseWindow/BaseWindow';
import { services } from '../services/SystemService/ServiceHandler';
import { WebExplorer } from '../apps/WebExplorer/WebExplorer';
import { VirtualCreate } from '../apps/VirtualCreate/VirtualCrate';
import { attachDebugMethod, isDev } from './requests';
import { AnApp } from '../apps/AnApp/AnApp';
import { IDELide } from '../apps/IDE-Lide.ts/IDE-Lide';

export declare type ReactGeneratorFunction = (id: number, props?: any) => JSX.Element;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface AllApps {
  manifest: IManifest;
  app: ReactGeneratorFunction;
}

export const allApps: AllApps[] = [];

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

export function installApp(baseWindow: BaseWindow | any) {
    if (!baseWindow) {
      throw new Error('Failed to install passed empty app');
    } 
    if (!baseWindow.manifest){
      throw new Error('Cannot install without manifest');
    }

    if (!baseWindow.manifest.launchName){
      throw new Error('Missing launch name');
    }
    const Element = baseWindow as any;

  const exist = allApps.find(a => a.manifest.launchName === baseWindow.manifest.launchName)
  if (exist) throw new Error(`App under name ${baseWindow.manifest.launchName} is already installed`); 
  allApps.push({
    manifest: baseWindow.manifest,
    app: (id: number, props?: any) => <Element key={id} id={id} onlyOne={!!baseWindow.onlyOne} {...props}></Element>,
  })
}

installApp(Terminal);
installApp(TaskManager);
if (!STATIC) {
  installApp(AccountManager);
  installApp(Lype);
  installApp(GroupViewer);
}

installApp(WebExplorer);
installApp(VirtualCreate);
installApp(MouseProperties);
installApp(IDELide);
if (DEVELOPMENT) {
  installApp(AnApp);
  (window as any).installApp = installApp;
}
