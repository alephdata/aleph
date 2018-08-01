import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux'
import { FocusStyleManager } from '@blueprintjs/core';
import { inRange } from 'lodash';

import { addLocaleData, IntlProvider } from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';
import bs from 'react-intl/locale-data/bs';
import ru from 'react-intl/locale-data/ru';
import es from 'react-intl/locale-data/es';
import ar from 'react-intl/locale-data/ar';

import translations from 'src/content/translations.json';
import Router from './Router';

// TODO Initialise store here instead of in store.js (which should just export
// createStore).
import store from './store';

// TODO Initialise endpoint in here instead of api.js. And then pass it down as
// context, like Provider passes down the store? Or use redux-axios-middleware?
import { endpoint } from './api';
import { logout } from 'src/actions/sessionActions';

import './App.css';

// have blueprint handle focus properly
FocusStyleManager.onlyShowFocusOnTabs();

// add locale data to react-intl
addLocaleData([...en, ...de, ...bs, ...es, ...ru, ...ar]);

const getLocale = function(store) {
  // determine the active locale to be used by the user interface. this is
  // either saved in localStorage or extracted from metadata. The initial
  // request to metadata will be sent with unmodified Accept-Language headers
  // allowing the backend to perform language negotiation.
  const { config, metadata } = store.getState();
  if (config && config.locale) {
    return config.locale;
  }
  if (metadata && metadata.app) {
    return metadata.app.locale;
  }
};

// Configure endpoint to add session bearer token.
endpoint.interceptors.request.use(config => {
  const { session } = store.getState(),
        locale = getLocale(store);
  if (session.loggedIn) {
    config.headers.common['Authorization'] = `Bearer ${session.token}`;
  }
  if (locale) {
    config.headers.common['Accept-Language'] = locale;
  }
  config.headers.common['Aleph-Session-ID'] = session.sessionID;
  return config;
});

// Upon 401 Unauthorised (e.g. session has expired), reset the whole app.
endpoint.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Use a response's error message when available.
endpoint.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      inRange(error.response.status, 400, 500) &&
      error.response.data && error.response.data.message
    ) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

class App extends React.Component {
  render() {
    const locale = getLocale(store) || 'en';
    return (
      <Provider store={store}>
        <IntlProvider locale={locale} key={locale} messages={translations[locale]}>
          <BrowserRouter>
            <Route path="/" component={Router} />
          </BrowserRouter>
        </IntlProvider>
      </Provider>
    )
  }
}

export default App;
