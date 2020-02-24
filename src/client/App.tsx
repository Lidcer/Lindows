import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Pages
import { Home } from './components/Home';
import { BlueScreen } from './components/BlueScreen/BlueScreen';
import './App.scss';

export const App = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path='/' component={Home} />
        {/* <Route path='/about' component={About} /> */}
        <Route path='*' component={BlueScreen} />
      </Switch>
    </BrowserRouter>
  );
};
