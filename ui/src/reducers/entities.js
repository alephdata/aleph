import { createReducer } from 'redux-act';

import {
  queryEntities,
  fetchEntity,
  createEntity,
  updateEntity,
  deleteEntity,
} from 'src/actions';
import {
  objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects,
} from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntity.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchEntity.ERROR]: (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchEntity.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [createEntity.START]: (state, { id }) => objectLoadStart(state, id),

  [createEntity.ERROR]: (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [createEntity.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [updateEntity.START]: (state, { id }) => objectLoadStart(state, id),

  [updateEntity.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [queryEntities.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [deleteEntity.COMPLETE]: (state, { id }) => objectDelete(state, id),

}, initialState);
