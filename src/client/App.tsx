import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Main } from './components/Main';
import { BlueScreen } from './components/BlueScreen/BlueScreen';
import './App.scss';
import { AccountManagerWebpage } from './apps/AccountManager/AccountManagerWebpage';
import { LypeWebpage } from './apps/Lype/LypeWebpage';
import { PopupRenderer } from './components/Popup/popupRenderer';

export class App extends React.Component {
  render() {
    return (
      <>
        <BrowserRouter>
          <Switch>
            <Route exact path='/' component={Main} />
            <Route exact path='/account' component={AccountManagerWebpage} />
            <Route exact path='/lype' component={LypeWebpage} />
            <Route path='*' component={BlueScreen} />
          </Switch>
        </BrowserRouter>
        <PopupRenderer />
      </>
    );
  }
}
