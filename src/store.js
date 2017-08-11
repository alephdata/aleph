import {applyMiddleware, createStore} from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import {loadState, saveState} from "./storage";
import {throttle} from "lodash";

import rootReducer from './reducers';
import {setAuthHeader} from "./api";

const persistedState = loadState();
const store = createStore(
  rootReducer,
  persistedState,
  applyMiddleware(
    thunk,
    logger
  )
);

const initialState = store.getState();
if (initialState.session && initialState.session.token) {
  setAuthHeader(`Bearer ${initialState.session.token}`);
}

store.subscribe(throttle(() => {
  saveState({
    session: store.getState().session
  })
}));

export default store;
