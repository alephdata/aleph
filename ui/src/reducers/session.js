import { createReducer } from 'redux-act';
import jwtDecode from 'jwt-decode';
import uuidv4 from 'uuid/v4';

import { loginWithToken, logout } from 'src/actions/sessionActions';
import { fetchRole, updateRole } from 'src/actions';

const initialState = {
  loggedIn: false,
  sessionID: uuidv4(),
};

const login = (state, token) => {
  const data = jwtDecode(token);
  return {
    ...data,
    token,
    loggedIn: true,
    sessionID: state.sessionID || uuidv4(),
  };
};

const storeRole = (state, { role }) => ({
  ...state,
  role: role
})

export default createReducer({
  [loginWithToken]: (state, token) => login(state, token),
  [logout]: state => ({ loggedIn: false, sessionID: uuidv4(), }),

  [fetchRole.COMPLETE]: storeRole,
  [updateRole.COMPLETE]: storeRole,
}, initialState);
