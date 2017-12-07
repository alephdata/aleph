import React from 'react';
import {BrowserRouter, Route} from 'react-router-dom';
import {Provider} from 'react-redux'
import {FocusStyleManager} from '@blueprintjs/core';

import {addLocaleData, IntlProvider} from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';
import ru from 'react-intl/locale-data/ru';
import es from 'react-intl/locale-data/es';

import translations from 'src/content/translations.json';
import PageLayout from 'src/components/PageLayout';
import store from './store';
import { endpoint } from './api';

import './App.css';

// have blueprint handle focus properly
FocusStyleManager.onlyShowFocusOnTabs();

// add locale data to react-intl
addLocaleData([...en, ...de, ...es, ...ru]);

// Configure endpoint to add session bearer token.
endpoint.interceptors.request.use(config => {
  const { session } = store.getState();
  if (session.loggedIn) {
    config.headers.common['Authorization'] = `Bearer ${session.token}`;
  }
  return config;
});


const App = () => (
  <Provider store={store}>
    <IntlProvider locale="de" messages={translations.de}>
      <BrowserRouter>
        <Route path="/" component={PageLayout} />
      </BrowserRouter>
    </IntlProvider>
  </Provider>
);

export default App;
