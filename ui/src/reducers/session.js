import { createReducer } from 'redux-act';

import { fetchMetadata, loginWithToken, logout } from 'actions';

const initialState = { loggedIn: false };

const handleLogin = (state, token) => {
  if (!token) {
    return state;
  } else {
    return {
      ...state,
      token,
      loggedIn: true,
    };
  };
};

const handleLogout = (state, { redirect }) => ({
  sessionId: state.sessionId,
  sessionStart: state.sessionStart,
  logoutRedirect: redirect,
  loggedIn: false,
});

export default createReducer({
  [loginWithToken]: handleLogin,
  [logout.COMPLETE]: handleLogout,
  [logout.ERROR]: handleLogout,
  [fetchMetadata.COMPLETE]: (state, { metadata }) => handleLogin(state, metadata?.token),
}, initialState);

