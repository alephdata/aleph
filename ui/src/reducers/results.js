import { createReducer } from 'redux-act';

import {
  resultLoadStart, resultLoadError, updateResults, invalidateResults,
} from 'src/reducers/util';

import {
  queryCollections,
  queryEntities,
  queryNotifications,
  createCollection,
  deleteCollection,
  ingestDocument,
  deleteEntity,
  queryDashboard,
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

  [queryDashboard.START]: (state, { query }) => resultLoadStart(state, query),

  [queryDashboard.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryDashboard.COMPLETE]: updateResults,

  // Clear out the results cache when operations are performed that
  // may affect the content of the results.
  [createCollection.COMPLETE]: invalidateResults,
  [deleteCollection.COMPLETE]: invalidateResults,
  [ingestDocument.COMPLETE]: invalidateResults,
  [deleteEntity.COMPLETE]: invalidateResults,

}, initialState);
