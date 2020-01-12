import { createReducer } from 'redux-act';

import { fetchCollectionMappings, updateCollectionMapping, createCollectionMapping, deleteCollectionMapping } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionMappings.START]: (state, {
    collectionId,
  }) => objectLoadStart(state, collectionId),

  [fetchCollectionMappings.ERROR]: (state, {
    error, args: { collectionId },
  }) => objectLoadError(state, collectionId, error),

  [fetchCollectionMappings.COMPLETE]: (state, {
    collectionId, data,
  }) => objectLoadComplete(state, collectionId, data),

  [deleteCollectionMapping.COMPLETE]: (state, {
    collectionId,
  }) => objectDelete(state, collectionId),

}, initialState);
