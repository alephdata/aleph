import { createReducer } from 'redux-act';

import { fetchCollection, updateCollection, queryCollections, createCollection, deleteCollection } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [queryCollections.COMPLETE]: (state, { result }) => 
    resultObjects(state, result),

  [fetchCollection.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchCollection.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id, error),

  [fetchCollection.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

  [updateCollection.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

  [createCollection.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

  [deleteCollection.COMPLETE]: (state, { id, data }) =>
    objectDelete(state, id),

}, initialState);
