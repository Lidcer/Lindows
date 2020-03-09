import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Pages

import { Main } from './components/Main';
import { BlueScreen } from './components/BlueScreen/BlueScreen';
import './App.scss';
import { AccountManagerWebpage } from './apps/AccountManager/AccountManagerWebpage';
import { LypeWebpage } from './apps/Lype/LypeWebpage';

export class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path='/' component={Main} />
          <Route exact path='/account' component={AccountManagerWebpage} />
          <Route exact path='/lype' component={LypeWebpage} />
          {/* <Route path='/about' component={About} /> */}
          <Route path='*' component={BlueScreen} />
        </Switch>
      </BrowserRouter>
    );
  }
}
