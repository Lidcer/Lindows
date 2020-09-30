import { ExplorerFile, ExplorerFolder } from "./FileExplorer";

export const sampleCode = [
    `import React from 'react';`,
    `import { IManifest, BaseWindow, MessageBox } from 'BaseWindow';`,
    `import { AppWarper } from './styled.ts';`,
    ``,
    `export class TestApp extends BaseWindow {`,
    `  public static manifest: IManifest = {`,
    `    fullAppName: 'Test App',`,
    `    launchName: 'devapp',`,
    `    icon: '/assets/images/unknown-app.svg',`,
    `  };`,
    ``,
    `  constructor(props) {`,
    `    super(`,
    `      props,`,
    `      {`,
    `        minHeight: 300,`,
    `        minWidth: 300,`,
    `      },`,
    `    );`,
    `  }`,
    ``,
    `  renderInside() {`,
    `    return (`,
    `      <AppWarper>`,
    `        <h1>Hello World</h1>`,
    `      </AppWarper>`,
    `    );`,
    `  }`,
    `}`,
    ``
  ].join('\n');

export const styledCode = [
    `import styled from 'styled-components';`,
    ``,
    `export const AppWarper = styled.button\``,
    `    background-color:gray;`,
    `    color:white;`,
    `    border: 1px solid white;`,
    `    outline:none;`,
    `\``,
    ``
].join('\n');


const files: ExplorerFile[] = [
  { name: 'main.tsx', content: sampleCode, path: '/'},
  { name: 'styled.ts', content: styledCode, path: '/'},
]

export const templateProject: ExplorerFolder =  {
  name: 'Basic app',
  contents: [
    ...files,
  ],
  collapsed: false
}


