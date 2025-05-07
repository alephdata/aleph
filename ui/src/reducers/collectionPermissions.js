import { createReducer } from 'redux-act';

import {
  fetchCollectionPermissions,
  updateCollectionPermissions,
} from '/src/actions/index.js';
import {
  objectLoadStart,
  objectLoadError,
  objectLoadComplete,
} from '/src/reducers/util.js';

const initialState = {};

export default createReducer(
  {
    [fetchCollectionPermissions.START]: (state, { id }) =>
      objectLoadStart(state, id),

    [fetchCollectionPermissions.ERROR]: (state, { error, args: { id } }) =>
      objectLoadError(state, id, error),

    [fetchCollectionPermissions.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),

    [updateCollectionPermissions.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),
  },
  initialState
);
