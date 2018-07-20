import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollectionPermissions, updateCollectionPermissions } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionPermissions.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchCollectionPermissions.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id, error),

  [fetchCollectionPermissions.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data.results),

  [updateCollectionPermissions.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data.results),

}, initialState);
