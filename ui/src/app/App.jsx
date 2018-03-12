import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux'
import { FocusStyleManager } from '@blueprintjs/core';
import { inRange } from 'lodash';

import { addLocaleData, IntlProvider } from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';
import ru from 'react-intl/locale-data/ru';
import es from 'react-intl/locale-data/es';

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
addLocaleData([...en, ...de, ...es, ...ru]);

// TODO store this value in the redux state, make it changeable by the user.
const locale='en';

// Configure endpoint to add session bearer token.
endpoint.interceptors.request.use(config => {
  const { session } = store.getState();
  if (session.loggedIn) {
    config.headers.common['Authorization'] = `Bearer ${session.token}`;
  }
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
    return (
      <Provider store={store}>
        <IntlProvider locale={locale} messages={translations[locale]}>
          <BrowserRouter>
            <Route path="/" component={Router} />
          </BrowserRouter>
        </IntlProvider>
      </Provider>
    )
  }
}

export default App;
