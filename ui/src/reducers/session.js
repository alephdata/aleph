import { createReducer } from 'redux-act';
import { v4 as uuidv4 } from 'uuid';

import { fetchMetadata, loginWithToken, logout } from 'actions';

const initialState = {
  loggedIn: false,
  sessionId: uuidv4(),
};

const handleLogin = (state, token) => {
  if (!token) {
    return state;
  } else {
    return {
      token,
      loggedIn: true,
      roleId: token.split('.', 1),
      sessionId: state.sessionId || uuidv4(),
    };
  };
};

const handleLogout = state => ({
  loggedIn: false,
  sessionId: state.sessionId || uuidv4(),
});

export default createReducer({
  [loginWithToken]: handleLogin,
  [logout.COMPLETE]: handleLogout,
  [logout.ERROR]: handleLogout,
  [fetchMetadata.COMPLETE]: (state, { metadata }) => handleLogin(state, metadata?.token),
}, initialState);

