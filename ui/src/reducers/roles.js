import jwtDecode from 'jwt-decode';
import { createReducer } from 'redux-act';

import { loginWithToken } from 'src/actions/sessionActions';
import { queryRoles, fetchRole, updateRole } from 'src/actions';
import { resultObjects, objectLoadStart, objectLoadError, objectLoadComplete } from './util';

const initialState = {};

const handleLogin = (state, token) => {
  const data = jwtDecode(token);
  return objectLoadComplete(state, data.role.id, data.role);
};

export default createReducer({
  [queryRoles.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchRole.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchRole.ERROR]: (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchRole.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [updateRole.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [loginWithToken]: handleLogin,
}, initialState);
