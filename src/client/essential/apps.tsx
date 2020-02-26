import { Terminal, manifest as terminalManifest } from '../apps/Terminal/Terminal';
import { TaskManager, manifest as taskManagerManifest } from '../apps/TaskManager/TaskManager';
import { AccountManager, manifest as accountManagerManifest } from '../apps/AccountManager/AccountManager';

import { processor } from './processor';
import React from 'react';
import { IManifest } from '../apps/BaseWindow/BaseWindow';

export declare type reactGeneratorFunction = (id: number) => JSX.Element;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface AllApps {
  manifest: IManifest;
  app: reactGeneratorFunction;
}

export const allApps: AllApps[] = [
  { manifest: terminalManifest, app: (id: number) => <Terminal key={id} id={id}></Terminal> },
  {
    manifest: taskManagerManifest,
    app: (id: number) => <TaskManager key={id} id={id} onlyOne={true}></TaskManager>,
  },
  {
    manifest: accountManagerManifest,
    app: (id: number) => <AccountManager key={id} id={id} onlyOne={true}></AccountManager>,
  },
];

export function launchApp(appName: string) {
  const object = allApps.find(a => a.manifest.launchName.toLowerCase() === appName.toLowerCase());
  if (object) {
    processor.addApp(object.app);
    return true;
  }

  return false;
}
