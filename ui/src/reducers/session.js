import { createReducer } from 'redux-act';
import jwtDecode from 'jwt-decode';
import uuidv4 from 'uuid/v4';

import { loginWithToken, logout } from 'src/actions/sessionActions';
import { fetchRole, updateRole } from 'src/actions';

const initialState = {
  loggedIn: false,
  sessionID: uuidv4(),
};

const handleLogin = (state, token) => {
  const data = jwtDecode(token);
  return {
    ...data,
    token,
    loggedIn: true,
    sessionID: state.sessionID || uuidv4(),
  };
};

const handleLogout = state => ({
  loggedIn: false,
  sessionID: state.sessionID || uuidv4(),
});

const storeRole = (state, { role }) => ({
  ...state,
  role,
});

export default createReducer({
  [loginWithToken]: handleLogin,
  [logout]: handleLogout,
  [fetchRole.COMPLETE]: storeRole,
  [updateRole.COMPLETE]: storeRole,
}, initialState);
