import { createReducer } from 'redux-act';
import jwtDecode from 'jwt-decode';

import { loginWithToken, logout } from 'src/actions/sessionActions';

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

export default createReducer({
  [loginWithToken]: (state, token) => login(token),
  [logout]: state => ({ loggedIn: false }),
}, initialState);
