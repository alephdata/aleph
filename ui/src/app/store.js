import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
// import logger from 'redux-logger';
import { throttle } from 'lodash';

import rootReducer from '/src/reducers/index.js';
import { loadState, saveState } from '/src/app/storage.js';
import errorToastMiddleware from '/src/app/error-toast-middleware.js';

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
    const { session, config, messages } = store.getState();

    saveState({
      session,
      config,
      // Do not persist the actual messages, only the dismissed message IDs.
      messages: { ...messages, messages: [] },
    });
  })
);

export default store;
