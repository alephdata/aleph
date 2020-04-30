import jwtDecode from 'jwt-decode';
import { createReducer } from 'redux-act';
import { v4 as uuidv4 } from 'uuid';
import { fetchMetadata } from 'src/actions';

import { loginWithToken, logout } from 'src/actions/sessionActions';

const initialState = {
  loggedIn: false,
  sessionID: uuidv4(),
};

const handleLogin = (state, token) => {
  if (!token) {
    return state;
  } else {
    const data = jwtDecode(token);
    return {
      token,
      isAdmin: data.a,
      id: data.role.id,
      roles: data.r,
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
  [logout]: handleLogout,
  [fetchMetadata.COMPLETE]: (state, {metadata}) => handleLogin(state, metadata?.token),
}, initialState);

