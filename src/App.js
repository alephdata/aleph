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
import SearchScreen from './screens/SearchScreen';
import ErrorScreen from './screens/ErrorScreen';
import PageLayout from './screens/PageLayout';

import './App.css';

// have blueprint handle focus properly
FocusStyleManager.onlyShowFocusOnTabs();

// add locale data to react-intl
addLocaleData([...en, ...de, ...es, ...ru]);


const App = () =>  (
  <div className="App">
    <Provider store={store}>
      <IntlProvider locale="de" messages={translations.de}>
        <PageLayout>
          <Router>
            <Switch>
              <Redirect exact from="/" to="/search"/>
              <Route path="/search" exact component={SearchScreen}/>
              <Route component={ErrorScreen}/>
            </Switch>
          </Router>
        </PageLayout>
      </IntlProvider>
    </Provider>
  </div>
);

export default App;
