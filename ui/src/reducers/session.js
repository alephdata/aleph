import { createReducer } from 'redux-act';
import jwtDecode from 'jwt-decode';

import { loginWithToken, logout } from 'src/actions/sessionActions';
import { fetchRole, updateRole } from 'src/actions';
import { generateUUID } from './util';

const initialState = {
  loggedIn: false,
  sessionID: generateUUID(),
};

const login = (state, token) => {
  const data = jwtDecode(token);
  return {
    ...data,
    token,
    loggedIn: true,
    sessionID: state.sessionID,
  };
};

const storeRole = (state, { role }) => ({
  ...state,
  role: role
})

export default createReducer({
  [loginWithToken]: (state, token) => login(state, token),
  [logout]: state => ({ loggedIn: false, sessionID: generateUUID(), }),

  [fetchRole.COMPLETE]: storeRole,
  [updateRole.COMPLETE]: storeRole,
}, initialState);
