import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';

import EntityScreen from 'components/entity/EntityScreen';
import RootScreen from './RootScreen';
import CollectionScreen from 'components/collection/CollectionScreen';
import ErrorScreen from './ErrorScreen';

class SwitchPage extends Component {
  render() {
    return (
      <Switch>
        <Route path="/entities/:entityId" component={EntityScreen}/>
        <Route path="/collections/:collectionId" exact component={CollectionScreen}/>
        <Route path="/" exact component={RootScreen}/>
        <Route component={ErrorScreen}/>
      </Switch>
    )
  }
}

export default SwitchPage;
