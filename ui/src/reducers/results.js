import { createReducer } from 'redux-act';

import { resultLoadStart, resultLoadError } from 'src/reducers/util';
import { updateResults, invalidateResults } from 'src/reducers/util';

import {
  queryCollections,
  queryEntities,
  queryDocumentRecords,
  queryNotifications,
  createCollection,
  deleteCollection,
  ingestDocument,
  deleteDocument
} from 'src/actions';

const initialState = {};

export default createReducer({
  
  [queryCollections.START]: (state, { query }) => 
    resultLoadStart(state, query),

  [queryCollections.ERROR]: (state, { error, args: { query } }) =>
    resultLoadError(state, query, error),

  [queryCollections.COMPLETE]: updateResults,

  [queryEntities.START]: (state, { query }) => 
    resultLoadStart(state, query),

  [queryEntities.ERROR]: (state, { error, args: { query } }) =>
    resultLoadError(state, query, error),

  [queryEntities.COMPLETE]: updateResults,

  [queryDocumentRecords.START]: (state, { query }) => 
    resultLoadStart(state, query),

  [queryDocumentRecords.ERROR]: (state, { error, args: { query } }) =>
    resultLoadError(state, query, error),

  [queryDocumentRecords.COMPLETE]: updateResults,

  [queryNotifications.START]: (state, { query }) => 
    resultLoadStart(state, query),

  [queryNotifications.ERROR]: (state, { error, args: { query } }) =>
    resultLoadError(state, query, error),

  [queryNotifications.COMPLETE]: updateResults,

  // Clear out the results cache when operations are performed that
  // may affect the content of the results.
  [createCollection.COMPLETE]: invalidateResults,
  [deleteCollection.COMPLETE]: invalidateResults,
  [ingestDocument.COMPLETE]: invalidateResults,
  [deleteDocument.COMPLETE]: invalidateResults,

}, initialState);
