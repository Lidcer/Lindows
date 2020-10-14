import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Pages

import { AccountManagerWebpage } from '.././apps/AccountManager/AccountManagerWebpage';
import { LypeWebpage } from '.././apps/Lype/LypeWebpage';
import '.././App.scss';
import { TestWebPage } from './TestWebPage';
import { WindowTester } from './WindowTester';
import { PopupRenderer } from '../components/Popup/popupRenderer';

export class Test extends React.Component {
  render() {
    return (
      <>
        <BrowserRouter>
          <Switch>
            <Route exact path='*/app-tester/*' component={WindowTester} />
            <Route exact path='*/account/' component={AccountManagerWebpage} />
            <Route exact path='*/lype/' component={LypeWebpage} />
            <Route exact path='*/**' component={TestWebPage} />
          </Switch>
        </BrowserRouter>
        <PopupRenderer />
      </>
    );
  }
}
