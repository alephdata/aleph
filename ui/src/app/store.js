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
  /*window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(*/applyMiddleware(
    thunk,
    errorToastMiddleware,
    // logger
  )/* ) */,
);

store.subscribe(throttle(() => {
  const state = store.getState();
  const session = state.session;
  saveState({
    session: {
      token: session.token,
      loggedIn: session.loggedIn,
      sessionID: session.sessionID
    },
    config: state.config,
  });
}));

export default store;
