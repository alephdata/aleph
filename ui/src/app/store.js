import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
// import logger from 'redux-logger';
import { throttle } from 'lodash';

import rootReducer from 'reducers';
import { loadState, saveState } from './storage';
import errorToastMiddleware from './error-toast-middleware';

const persistedState = loadState();
const store = createStore(
  rootReducer,
  persistedState,
  // eslint-disable-next-line
  /*window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(*/ applyMiddleware(
    thunk,
    errorToastMiddleware
    // logger
  ) /* ) */
);

store.subscribe(
  throttle(() => {
    const { session, config, messages, localBookmarks } = store.getState();

    saveState({
      session,
      config,

      // TODO: Remove after deadline
      // See https://github.com/alephdata/aleph/issues/2864
      bookmarks: localBookmarks,

      // Do not persist the actual messages, only the dismissed message IDs.
      messages: { ...messages, messages: [] },
    });
  })
);

export default store;
