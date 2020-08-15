import { IManifest, BaseWindow } from '../BaseWindow/BaseWindow';
import React from 'react';
import {
  Frame,
  BrowserUrl,
  WebExplorerWarper,
  BackButton,
  ForwardButton,
  BrowserUrlInput,
  Reload,
} from './WebExplorerStyled';
import * as Axios from 'axios';
import { attachDebugMethod } from '../../essential/requests';
import { WebExplorerDevTools } from './WebExplorerDevTools';
import { faArrowLeft, faArrowRight, faSpinner, faUndo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface WebExplorerState {
  url: string;
  urlLoaded: string | undefined;
  backHistory: string[];
  forwardHistory: string[];
}

export class WebExplorer extends BaseWindow<WebExplorerState> {
  public static manifest: IManifest = {
    fullAppName: 'Web Explorer',
    launchName: 'webexplorer',
    icon: '/assets/images/appsIcons/WebExplorer.svg',
  };
  private doNotUpdateUrl = true;

  private ref: React.RefObject<HTMLIFrameElement> = React.createRef();

  constructor(props) {
    super(
      props,
      {
        minHeight: 700,
        minWidth: 850,
      },
      {
        url: 'https://www.bing.com/',
        urlLoaded: 'https://www.bing.com/',
        backHistory: [],
        forwardHistory: [],
      },
    );
    attachDebugMethod('webExplorer', this);
  }

  shown() {
    this.iframe.addEventListener('load', this.oniFrameLoad);
  }
  closing() {
    this.iframe.removeEventListener('load', this.oniFrameLoad);
  }

  oniFrameLoad = ev => {
    let url = '';
    try {
      url = this.iframe.contentWindow.location.href;
    } catch (_) {
      try {
        url = this.iframe.contentDocument.location.href;
      } catch (_) {
        /* ignored there is nothing that we can do */
      }
    }
    const vars = { ...this.variables };
    if (this.doNotUpdateUrl) {
      this.doNotUpdateUrl = false;
      return;
    } else if (url) {
      vars.backHistory.push(url);
      this.setVariables(vars);
    } else if (vars.url) {
      vars.backHistory.push(vars.url);
      this.setVariables(vars);
    }

    this.setVariables({ url });
  };

  onChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const url = ev.target.value;
    this.setVariables({ url });
  };

  onKeyPressReact = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      this.enter();
    }
  };

  enter = () => {
    this.doNotUpdateUrl = true;
    const vars = { ...this.variables };
    const url = vars.url;
    if (url && url !== vars.urlLoaded && vars.backHistory[vars.backHistory.length - 1] !== vars.urlLoaded) {
      vars.backHistory.push(vars.urlLoaded);
    }
    vars.forwardHistory = [];
    vars.urlLoaded = vars.url;
    this.setVariables(vars);
  };

  get iframe() {
    return this.ref.current;
  }

  reload = () => {
    const parent = this.iframe.parentElement;
    parent.removeChild(this.iframe);
    parent.appendChild(this.iframe);
  };

  back = () => {
    this.doNotUpdateUrl = true;
    const vars = { ...this.variables };
    if (vars.backHistory.length) {
      const url = vars.backHistory.pop();
      vars.forwardHistory.push(url);
      vars.url = url;
      vars.urlLoaded = url;
      this.setVariables(vars);
      this.reload()
    }
  };

  forward = () => {
    this.doNotUpdateUrl = true;
    const vars = { ...this.variables };
    if (vars.forwardHistory.length) {
      const url = vars.forwardHistory.pop();
      vars.backHistory.push(url);
      vars.url = url;
      vars.urlLoaded = url;
      this.setVariables(vars);
      this.reload()
    }
  };

  renderInside() {
    return (
      <WebExplorerWarper>
        <div>
          <BackButton onClick={this.back} title='Click to go back' disabled={!this.variables.backHistory.length}>
            <FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon>
          </BackButton>
          <ForwardButton
            onClick={this.forward}
            title='Click to go forward'
            disabled={!this.variables.forwardHistory.length}
          >
            <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
          </ForwardButton>
          <BrowserUrl>
            <BrowserUrlInput
              type='text'
              onChange={this.onChange}
              onKeyPress={this.onKeyPressReact}
              value={this.variables.url}
            />
            <Reload onClick={this.reload}>
              <FontAwesomeIcon icon={faUndo}></FontAwesomeIcon>
            </Reload>
          </BrowserUrl>
        </div>
        <Frame seamless ref={this.ref} loading='lazy' src={this.variables.urlLoaded}>
          Your browser is not supported
        </Frame>
      </WebExplorerWarper>
    );
  }
}
