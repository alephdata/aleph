import { createReducer } from 'redux-act';

import { fetchEntityMapping, createEntityMapping, deleteEntityMapping, updateEntityMapping } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntityMapping.START]: (state, {
    id,
  }) => objectLoadStart(state, id),

  [fetchEntityMapping.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchEntityMapping.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [createEntityMapping.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [updateEntityMapping.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [deleteEntityMapping.COMPLETE]: (state, {
    id,
  }) => objectDelete(state, id),

}, initialState);
