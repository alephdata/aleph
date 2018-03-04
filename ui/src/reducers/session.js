import { createReducer } from 'redux-act';
import jwtDecode from 'jwt-decode';

import { loginWithToken, logout } from 'src/actions/sessionActions';
import { fetchRole, updateRole } from 'src/actions';

const initialState = {
  loggedIn: false,
};

const login = (token) => {
  const data = jwtDecode(token);
  return {
    ...data,
    token,
    loggedIn: true,
  };
};

const storeRole = (state, { role }) => ({
  ...state,
  role: role
})

export default createReducer({
  [loginWithToken]: (state, token) => login(token),
  [logout]: state => ({ loggedIn: false }),

  [fetchRole.COMPLETE]: storeRole,
  [updateRole.COMPLETE]: storeRole,
}, initialState);
