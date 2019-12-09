import { createReducer } from 'redux-act';

import {
  resultLoadStart, resultLoadError, updateResults, invalidateResults,
} from 'src/reducers/util';

import {
  createCollection,
  createDiagram,
  deleteCollection,
  deleteDiagram,
  deleteEntity,
  queryCollections,
  queryDiagrams,
  queryEntities,
  queryNotifications,
} from 'src/actions';

const initialState = {};

export default createReducer({

  [queryCollections.START]: (state, { query }) => resultLoadStart(state, query),

  [queryCollections.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryCollections.COMPLETE]: updateResults,

  [queryEntities.START]: (state, { query }) => resultLoadStart(state, query),

  [queryEntities.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryEntities.COMPLETE]: updateResults,

  [queryNotifications.START]: (state, { query }) => resultLoadStart(state, query),

  [queryNotifications.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryNotifications.COMPLETE]: updateResults,

  [queryDiagrams.START]: (state, { query }) => resultLoadStart(state, query),

  [queryDiagrams.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryDiagrams.COMPLETE]: updateResults,

  // Clear out the results cache when operations are performed that
  // may affect the content of the results.
  [createCollection.COMPLETE]: invalidateResults,
  [createDiagram.COMPLETE]: invalidateResults,
  [deleteCollection.COMPLETE]: invalidateResults,
  [deleteDiagram.COMPLETE]: invalidateResults,
  [deleteEntity.COMPLETE]: invalidateResults,
  TRIGGER_COLLECTION_RELOAD: invalidateResults,

}, initialState);
