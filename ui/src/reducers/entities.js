import { createReducer } from 'redux-act';

import {
  queryEntities,
  fetchDocument,
  fetchEntity,
  deleteDocument
} from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchDocument.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchEntity.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchDocument.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id, error),

  [fetchEntity.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id, error),

  [fetchDocument.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

  [fetchEntity.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

  [queryEntities.COMPLETE]: (state, { result }) => 
    resultObjects(state, result),

  [deleteDocument.COMPLETE]: (state, { id, data }) =>
    objectDelete(state, id),

}, initialState);
