import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux'
import store from './store'

import DocumentsScreen  from './screens/DocumentsScreen';
import ErrorScreen      from './screens/ErrorScreen';
import Layout      from './screens/Layout';

import './App.css';

const App = () =>  (
  <div className="App">
    <Provider store={store}>
      <Layout>
        <Router>
          <Switch>
            <Redirect exact from="/" to="/documents"/>
            <Route path="/documents" exact component={DocumentsScreen}/>
            <Route component={ErrorScreen}/>
          </Switch>
        </Router>
      </Layout>
    </Provider>
  </div>
);

export default App;
