import { createReducer } from 'redux-act';
import { v4 as uuidv4 } from 'uuid';

import { fetchMetadata, fetchCurrentRole, loginWithToken, logout } from 'actions';
import { loadStart, loadError, loadComplete } from './util';

const initialState = {
  loggedIn: false,
  sessionID: uuidv4(),
};

const handleLogin = (state, token) => {
  if (!token) {
    return state;
  } else {
    return {
      token,
      loggedIn: true,
      sessionID: state.sessionID || uuidv4(),
    };
  };
};

const handleLogout = state => ({
  loggedIn: false,
  sessionID: state.sessionID || uuidv4(),
});

export default createReducer({
  [loginWithToken]: handleLogin,
  [logout.COMPLETE]: handleLogout,
  [logout.ERROR]: handleLogout,
  [fetchCurrentRole.START]: loadStart,
  [fetchCurrentRole.ERROR]: loadError,
  [fetchCurrentRole.COMPLETE]: (state, { id }) => ({
    ...loadComplete(state),
    roleId: id,
  }),
  [fetchMetadata.COMPLETE]: (state, { metadata }) => handleLogin(state, metadata?.token),
}, initialState);

