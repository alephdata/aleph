import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { FocusStyleManager } from '@blueprintjs/core';
import { isLangRtl } from '@alephdata/react-ftm';
import { inRange } from 'lodash';
import { logout } from 'actions/sessionActions';
import { selectLocale } from 'selectors';
import Router from './Router';
import Translator from './Translator';
import initializeIconRenderer from './initializeIconRenderer';
import { expireRecentlyViewed } from './storage';

// TODO Initialise store here instead of in store.js (which should just export
// createStore).
import store from './store';

// TODO Initialise endpoint in here instead of api.js. And then pass it down as
// context, like Provider passes down the store? Or use redux-axios-middleware?
import { endpoint } from './api';

import './App.scss';

// have blueprint handle focus properly
FocusStyleManager.onlyShowFocusOnTabs();


// Configure endpoint to add session bearer token.
endpoint.interceptors.request.use((config) => {
  const state = store.getState();
  const { session } = state;
  const locale = selectLocale(state);
  document.documentElement.lang = locale;
  document.documentElement.dir = isLangRtl(locale) ? "rtl" : "ltr";
  if (session.loggedIn) {
    Object.assign(config.headers.common, {
      Authorization: `Token ${session.token}`,
    });
  }
  if (session.sessionId) {
    Object.assign(config.headers.common, {
      'X-Aleph-Session': session.sessionId,
    });
  }
  if (locale) {
    Object.assign(config.headers.common, {
      'Accept-Language': locale,
    });
  }
  return config;
});

// Upon 401 Unauthorised (e.g. session has expired), reset the whole app.
endpoint.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);

// Use a response's error message when available.
endpoint.interceptors.response.use(
  response => response,
  (error) => {
    if (
      error.response
      && inRange(error.response.status, 400, 500)
      && error.response.data && error.response.data.message
    ) {
      Object.assign(error, {
        message: error.response.data.message,
      });
    }
    return Promise.reject(error);
  },
);


function App() {
  // extends blueprint icon renderer to render icons from the ftm iconRegistry
  initializeIconRenderer();
  expireRecentlyViewed();
  
  return (
    <Provider store={store}>
      <Translator>
        <BrowserRouter>
          <Route path="/" component={Router} />
        </BrowserRouter>
      </Translator>
    </Provider>
  );
}

export default App;
