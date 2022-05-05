import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from './pages/home';

// eslint-disable-next-line react/prefer-stateless-function
export default class Router extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={() => <Home />} />
        </Switch>
      </BrowserRouter>
    );
  }
}
