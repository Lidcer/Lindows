import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Pages

import { Home } from './components/Home';
import { BlueScreen } from './components/BlueScreen/BlueScreen';
import './App.scss';
import { AccountManagerWebpage } from './apps/AccountManager/AccountManagerWebpage';
import { LypeWebpage } from './apps/Lype/LypeWebpage';

export class App extends React.Component {
  componentDidMount() { }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path='/' component={Home} />
          <Route exact path='/account' component={AccountManagerWebpage} />
          <Route exact path='/lype' component={LypeWebpage} />
          {/* <Route path='/about' component={About} /> */}
          <Route path='*' component={BlueScreen} />
        </Switch>
      </BrowserRouter>
    );
  }
}
