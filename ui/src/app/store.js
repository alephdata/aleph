import {applyMiddleware, createStore, compose} from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import {throttle} from 'lodash';

import rootReducer from 'src/reducers';
import {loadState, saveState} from './storage';
import errorToastMiddleware from './error-toast-middleware';


const composeEnhancers =
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    }) : compose;

const persistedState = loadState();
const store = createStore(
  rootReducer,
  persistedState,
  composeEnhancers(
    applyMiddleware(
      thunk,
      errorToastMiddleware,
      logger
    )

  )
);


if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('../reducers', () => {
    const nextReducer = require('../reducers');
    store.replaceReducer(nextReducer);
  });
}
store.subscribe(throttle(() => {
  const state = store.getState();
  saveState({
    session: state.session,
    config: state.config
  })
}));

export default store;
