import { createReducer } from 'redux-act';

import {
  fetchCollection,
  updateCollection,
  queryCollections,
  createCollection,
  deleteCollection,
  createEntity,
} from 'src/actions';
import {
  objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects,
} from 'src/reducers/util';

const initialState = {};


export default createReducer({
  [queryCollections.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchCollection.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchCollection.ERROR]: (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchCollection.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [updateCollection.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [createCollection.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [deleteCollection.COMPLETE]: (state, { id }) => objectDelete(state, id),

  // We use the collection statistics to determine the counts on the table
  // editor. This goes out of sync when entities are created, so we're
  // sort of juking the stats here.
  [createEntity.COMPLETE]: (state, { data: entity }) => {
    const key = entity.collection?.id;
    const schemata = state[key]?.statistics?.schema?.values || {};
    schemata[entity.schema] = schemata[entity.schema] || 0;
    schemata[entity.schema] += 1;
    return state;
  },
}, initialState);
