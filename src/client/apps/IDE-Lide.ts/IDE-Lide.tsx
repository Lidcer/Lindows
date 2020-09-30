import React from 'react';
import * as BaseWindow from '../BaseWindow/BaseWindow';
import { WarperIDE, TextareaIDE, TabActive, Tab, EditorArea, Tabs, ToolBar, IDEContent, ToolBarButton } from './IDE-LideStyled';
import { random } from 'lodash';
import { transpile, CompilerOptions, ScriptTarget, ModuleResolutionKind, JsxEmit, ModuleKind } from 'typescript';
import AceEditor from "react-ace";
import safeEval from 'safer-eval';
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/theme-dracula";
import './IDE-Lide.scss';
import { services } from '../../services/SystemService/ServiceHandler';
import {  templateProject } from './template';
import { ExplorerFile, ExplorerFolder, getFolder, IDEFileExplorer, isFolder } from './FileExplorer';
import styled from 'styled-components';

interface Tab {
  content: string;
  name: string;
}

interface IDELideState {
  tabs: ExplorerFile[];
  activeTab?: ExplorerFile
  app: BaseWindow.BaseWindow | 'building' | undefined;
  root: ExplorerFolder;
}


export class IDELide extends BaseWindow.BaseWindow<IDELideState> {
  public static readonly onlyOne = true;
  public static manifest: BaseWindow.IManifest = {
    fullAppName: 'IDE Lide',
    launchName: 'idelide',
    icon: '/assets/images/appsIcons/ideLide.svg',
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 650,
        minWidth: 800,
      },
      {
        tabs:[
          templateProject.contents[0] as ExplorerFile,
        ],
        root: templateProject,
        app: undefined
      },
    );
  }

  shown() {
    this.setVariables({activeTab: this.variables.tabs[0]})
  }

  onChange = (code:string) => {
      this.variables.activeTab.content  = code;
      this.forceUpdate();
  };
  
  compile = async  () => {
    if (this.variables.app) return;
   // await this.setItem(this.variables.code);

    this.setVariables({app:'building'});

    const compilerOptions:CompilerOptions = {
      target: ScriptTarget.ES2017,
			lib: ['dom', 'es6'],
			module: ModuleKind.CommonJS,
			moduleResolution: ModuleResolutionKind.NodeJs,

      jsx: JsxEmit.React,
    };

    const code = transpile(this.variables.activeTab.content , compilerOptions);
    const context:any = { React };

    const codeMap = new Map<string, any>();

    let loc: ExplorerFile| ExplorerFolder = this.variables.root; 
    const req = (srt: string) => {
      console.log(srt)
      switch(srt) {
        case 'BaseWindow':
          return BaseWindow
        case 'MessageBox':
          return BaseWindow.MessageBox
        case 'react':
          return {...React, default: React};
        case 'styled-components':
          return {...styled, default: styled};
      }
      if (srt.startsWith('.')) {
        const path = srt.split('/'); 
        let m = loc;
  
          while (path.length) {
            const key = path.shift();
            if (key === '.') continue;
            if (key === '..') {
              if(!isFolder(m)){
                const folder = getFolder(m, this.variables.root);
                if (!folder) throw new Error('Compiler error: Unable to locate folder from file');
                m = folder;
              }
              const folder = getFolder(m, this.variables.root);
              if (!folder) throw new Error('Compiler error: Unable to locate folder');
              m = folder
              continue
            }

            if (path.length) {
              const folder = (m as ExplorerFolder).contents.find((f: ExplorerFolder) => f.contents  && f.name === key);
              if (!folder && !key) throw new Error(`Unknown directory`)
              if (!folder) throw new Error(`Directory does not exist: ${key}`)
              m = folder;
            } else {
              const file = (m as ExplorerFolder).contents.find((f: ExplorerFolder) => !f.contents && f.name === key) as ExplorerFile;
              console.log(m, key);
              if (!file && key) throw new Error(`File does not exist ${key}`)
              if (!file) throw new Error(`Unknown file not exist`)
              const existing = codeMap.has(file.content)
              if (existing) {
                return existing
              } else {
                loc = file; 
                const code = transpile(file.content, compilerOptions);
                const evaluate = `(() => {
                  var exports = {}; 
                  ${code}
                  return exports;
                  })()`;
                  console.log('ff', evaluate)
                  const fileCompiled = safeEval(evaluate, context) as BaseWindow.BaseWindow;
                  codeMap.set(file.content, fileCompiled);
                  loc = this.variables.root;
                  return fileCompiled; 
              }
            }
          }
          throw new Error(`Module does not exist: ${srt}`)
      }
      return null;
    }

    context.require = req;
    try {
      const evaluate = `(() => {
        var exports = {}; 
        ${code}
        return exports;
        })()`;
        const compiled = safeEval(evaluate, context) as BaseWindow.BaseWindow;

        const entires = [...Object.entries(compiled)];
        const entry = entires.find(f => (f[1] as any).manifest);
        if (!entry) {
          throw new Error ('Unknown app!'); 
        }
        if(!entry[1] || !entry[1].manifest || !entry[1].manifest.launchName || !entry[1].manifest.icon || !entry[1].manifest.fullAppName) {
          throw new Error ('invalid app checking that your app had manifest variable!'); 
        }
        const compiledApp = entry[1] as BaseWindow.BaseWindow;
        console.log(compiledApp)

      if(!compiledApp.onError) {
        //@ts-ignore shut the fuck up
        compiledApp.prototype.onError = (error) => {
          BaseWindow.MessageBox.Show(this, `App crashed!\nReason: ${error.message}\nStack: ${error.stack}`);
          this.terminateApp();
        }
      }
      //@ts-ignore
      const app = await compiledApp.New();
      this.setVariables({app})
      this.appMonitor();
    } catch (error) {
      console.error(error)
      this.setVariables({app:undefined});
      BaseWindow.MessageBox.Show(this, error.message);
    }

  };

  terminateApp = () => {
    const app = this.variables.app;
    if (app && typeof app !== 'string') {
      const id = app.id;
      app.exit();


      setTimeout(() => {
        this.removeFromProcessor(id);
        this.setVariables({app:undefined});
      });
    }
  }

  appMonitor = () => {
    const anApp = this.variables.app;
    if (!anApp || typeof anApp === 'string') return;
    if (anApp.destroyed) {
      const id = anApp.id;
      this.removeFromProcessor(id);
      this.setVariables({app:undefined})
    }

    requestAnimationFrame(this.appMonitor);
  }

  removeFromProcessor(appID:number) {
    const anApp = services.processor.runningApps.find(a => a.processID === appID);
    if (anApp) {
      const indexOf = services.processor.runningApps.indexOf(anApp);
      services.processor.runningApps.splice(indexOf, 0);
    }

  }

  get editorStyle():React.CSSProperties {
    return {
      width: '100%',
      height: '100%',
    }
  }


  onChangeSwitchTab(tab: ExplorerFile) {
    this.setVariables({activeTab: tab});
  }

  get tabs() {
    if (!this.variables.tabs.length) return null;
    return <Tabs>{this.variables.tabs.map((t, i) => {
      const active = t === this.variables.activeTab;

      if (active) {
      return <TabActive key={i} onClick={() => this.onChangeSwitchTab(t)}>{t.name}</TabActive>
    } else {
      return <Tab key={i} className='muted' onClick={() => this.onChangeSwitchTab(t)}>{t.name}</Tab>
      }
    
    })}</Tabs>
  }

  get editor() {
    const tab = this.variables.activeTab; 
    const tabs = this.variables.tabs; 
    if (!tabs.length) return <div>Start your project now</div>
    if (!tab) return <TextareaIDE>Select file to edit</TextareaIDE>

    return (   <TextareaIDE>
      <AceEditor
        mode="typescript"
        theme="dracula"
        style={this.editorStyle}
        onChange={this.onChange}
        name={`editor-${random(1000,9999999)}`}
        editorProps={{ 
          $blockScrolling: true
        }}
        value={tab.content }
        setOptions={{
          enableSnippets: true,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
        }}
      />
      </TextareaIDE>)

  }

  onFileClick = (explorerFile: ExplorerFile) => {
    const tabs = this.variables.tabs;
    if (!tabs.includes(explorerFile)) {
      tabs.push(explorerFile);
    }
    this.setVariables({activeTab: explorerFile});

  }

  onFileRename = (file: ExplorerFile) => {

  }


  onFileCreated = (file: ExplorerFile) => {
    const tabs = [...this.variables.tabs]; 
    tabs.push(file);
    this.setVariables({tabs, activeTab:file})
  }
  onFileDelete = (file: ExplorerFile) => {
    const tabs = [...this.variables.tabs]; 
    const index = tabs.indexOf(file);
    if (index !== -1) {
      tabs.splice(index, 1);
      if(this.variables.activeTab === file) {
        if (tabs.length) {
          this.setVariables({tabs, activeTab: tabs[0]});
        } else {
          this.setVariables({tabs, activeTab: undefined});
        }
      } else {
        this.setVariables({tabs});
      }
    }
  }

  renderInside() {
    let button = <ToolBarButton disabled>Compiling...</ToolBarButton>;
    if(!this.variables.app) {
      button = <ToolBarButton onClick={this.compile}>Build and run</ToolBarButton>;
    } else {
      button = <ToolBarButton onClick={this.terminateApp}>Terminate...</ToolBarButton>;
    }
    return (
      <WarperIDE>
        <ToolBar>
          { button }
        </ToolBar>
        <IDEContent>
          
          <IDEFileExplorer 

            onFileClick={this.onFileClick}
            onFileCreated={this.onFileCreated}
            onFileDeleted={this.onFileDelete}
            onFileRename={this.onFileRename}
            selected={this.state.variables.activeTab}
            fs={this.variables.root}
            />
          <EditorArea>
            {this.tabs}
            {this.editor}
          </EditorArea>
        </IDEContent>
      </WarperIDE>
    );
  }
}
