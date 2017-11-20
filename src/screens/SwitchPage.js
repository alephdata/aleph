import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import EntityScreen from './EntityScreen';
import ErrorScreen from './ErrorScreen';

class SwitchPage extends Component {
  render() {
    return (
      <Switch>
        <Route path="/entities/:id" component={EntityScreen}/>
        <Route component={ErrorScreen}/>
      </Switch>
    )
  }
}

export default SwitchPage;
