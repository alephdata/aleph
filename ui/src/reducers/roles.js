import { createReducer } from 'redux-act';

import { queryRoles, fetchRole, updateRole } from 'actions';
import {
  resultObjects,
  objectLoadStart,
  objectLoadError,
  objectLoadComplete,
} from './util';

const initialState = {};

export default createReducer(
  {
    [queryRoles.COMPLETE]: (state, { result }) => resultObjects(state, result),
    [fetchRole.START]: (state, { id }) => objectLoadStart(state, id),
    [fetchRole.ERROR]: (state, { error, args: { id } }) =>
      objectLoadError(state, id, error),
    [fetchRole.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),
    [updateRole.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),
  },
  initialState
);
