import { Terminal } from './apps/Terminal/Terminal';
import { TaskManager } from './apps/TaskManager/TaskManager';
import { processor } from './essential/processor';
import React from 'react';

export declare type reactGeneratorFunction = (id: number) => JSX.Element;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface AllApps {
  name: string;
  app: reactGeneratorFunction;
}

const allApps: AllApps[] = [
  { name: 'terminal', app: (id: number) => <Terminal key={id} id={id}></Terminal> },
  {
    name: 'taskmanager',
    app: (id: number) => <TaskManager key={id} id={id} onlyOne={true}></TaskManager>,
  },
];

export function launchApp(appName: string) {
  const object = allApps.find(a => a.name.toLowerCase() === appName.toLowerCase());
  if (object) {
    processor.addApp(object.app);
    return true;
  }

  return false;
}
