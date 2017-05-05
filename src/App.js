import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux'
import store from './store'

import DocumentsScreen  from './screens/DocumentsScreen';
import ErrorScreen      from './screens/ErrorScreen';

import './App.css';

const App = () =>  (
  <div className="App">
    <Provider store={store}>
      <Router>
        <Switch>
          <Redirect exact from="/" to="/documents"/>
          <Route path="/documents" exact component={DocumentsScreen}/>
          <Route component={ErrorScreen}/>
        </Switch>
      </Router>
    </Provider>
  </div>
);

export default App;