import { createReducer } from 'redux-act';

import { queryEntitySets, fetchEntitySet, updateEntitySet, createEntitySetMutate, createEntitySetNoMutate, deleteEntitySet } from 'actions';
import { objectLoadComplete, objectLoadError, objectLoadStart, objectDelete, resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer({
  [queryEntitySets.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchEntitySet.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchEntitySet.ERROR]: (state, {
    error, args,
  }) => objectLoadError(state, args, error),

  [fetchEntitySet.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [createEntitySetMutate.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [createEntitySetNoMutate.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [updateEntitySet.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [deleteEntitySet.COMPLETE]: (state, {
    entitySetId,
  }) => objectDelete(state, entitySetId),

}, initialState);
