import { createReducer } from 'redux-act';

import { fetchCollectionMapping, updateCollectionMapping, createCollectionMapping, deleteCollectionMapping } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionMapping.START]: (state, { collectionId }) => objectLoadStart(state, collectionId),

  [fetchCollectionMapping.ERROR]: (state, {
    error, args: { collectionId },
  }) => objectLoadError(state, collectionId, error),

  [fetchCollectionMapping.COMPLETE]: (state, {
    collectionId, data,
  }) => objectLoadComplete(state, collectionId, data),

  [createCollectionMapping.COMPLETE]: (state, {
    collectionId, data,
  }) => objectLoadComplete(state, collectionId, data),

  [updateCollectionMapping.COMPLETE]: (state, {
    collectionId, data,
  }) => objectLoadComplete(state, collectionId, data),

  [deleteCollectionMapping.COMPLETE]: (state, { collectionId }) => {
    console.log('in delete complete', collectionId, state);
    return objectDelete(state, collectionId);
  },

}, initialState);
