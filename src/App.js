import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux'
import { FocusStyleManager } from '@blueprintjs/core';

import { addLocaleData, IntlProvider } from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';
import ru from 'react-intl/locale-data/ru';
import es from 'react-intl/locale-data/es';
import translations from './translations.json';

import store from './store'
import DocumentsScreen from './screens/DocumentsScreen';
import ErrorScreen from './screens/ErrorScreen';
import Layout from './screens/Layout';

import './App.css';

// have blueprint handle focus properly
FocusStyleManager.onlyShowFocusOnTabs();

// add locale data to react-intl
addLocaleData([...en, ...de, ...es, ...ru]);


console.log(translations);


const App = () =>  (
  <div className="App">
    <Provider store={store}>
      <IntlProvider locale="de" messages={translations.de}>
        <Layout>
          <Router>
            <Switch>
              <Redirect exact from="/" to="/documents"/>
              <Route path="/documents" exact component={DocumentsScreen}/>
              <Route component={ErrorScreen}/>
            </Switch>
          </Router>
        </Layout>
      </IntlProvider>
    </Provider>
  </div>
);

export default App;
