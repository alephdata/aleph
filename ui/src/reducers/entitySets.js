import { createReducer } from 'redux-act';

import { queryEntitySets, fetchEntitySet, updateEntitySet, createEntitySet, deleteEntitySet } from 'src/actions';
import { objectLoadComplete, objectLoadError, objectDelete, resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [queryEntitySets.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchEntitySet.ERROR]: (state, {
    error, args,
  }) => objectLoadError(state, args, error),

  [fetchEntitySet.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [createEntitySet.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [updateEntitySet.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [deleteEntitySet.COMPLETE]: (state, {
    entitySetId,
  }) => objectDelete(state, entitySetId),

}, initialState);
