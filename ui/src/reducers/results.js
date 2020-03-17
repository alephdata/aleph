import { createReducer } from 'redux-act';

import {
  resultLoadStart, resultLoadError, updateResults,
} from 'src/reducers/util';

import {
  queryCollections,
  queryDiagrams,
  queryEntities,
  queryNotifications,
  queryCollectionXref,
} from 'src/actions';

const initialState = {};

export default createReducer({

  [queryCollections.START]: (state, { query }) => resultLoadStart(state, query),

  [queryCollections.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),

  [queryCollections.COMPLETE]: updateResults,

  [queryEntities.START]: (state, { query }) => resultLoadStart(state, query),

  [queryEntities.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),

  [queryEntities.COMPLETE]: updateResults,

  [queryNotifications.START]: (state, { query }) => resultLoadStart(state, query),

  [queryNotifications.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),

  [queryNotifications.COMPLETE]: updateResults,

  [queryDiagrams.START]: (state, { query }) => resultLoadStart(state, query),

  [queryDiagrams.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryCollectionXref.COMPLETE]: updateResults,

  [queryCollectionXref.START]: (state, { query }) => resultLoadStart(state, query),

  [queryCollectionXref.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryDiagrams.COMPLETE]: updateResults,
}, initialState);
