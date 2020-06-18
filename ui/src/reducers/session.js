import jwtDecode from 'jwt-decode';
import { createReducer } from 'redux-act';
import { v4 as uuidv4 } from 'uuid';
import { fetchMetadata, updateRole, fetchRole } from 'src/actions';

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
      role: data.role,
      sessionID: state.sessionID || uuidv4(),
    };
  };
};

const handleLogout = state => ({
  loggedIn: false,
  sessionID: state.sessionID || uuidv4(),
});

const handleRole = (state, id, data) => {
  if (state.role.id === id) {
    state.role = data;
  }
  return state;
}

export default createReducer({
  [loginWithToken]: handleLogin,
  [logout]: handleLogout,
  [fetchRole.COMPLETE]: (state, { id, data }) => handleRole(state, id, data),
  [updateRole.COMPLETE]: (state, { id, data }) => handleRole(state, id, data),
  [fetchMetadata.COMPLETE]: (state, {metadata}) => handleLogin(state, metadata?.token),
}, initialState);

