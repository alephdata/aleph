import { createReducer } from 'redux-act';

import {
  resultLoadStart, resultLoadError, updateResults, updateExpandResults,
} from 'reducers/util';

import {
  queryCollections,
  queryEntitySets,
  queryRoles,
  queryEntities,
  queryEntityExpand,
  queryNotifications,
  queryCollectionXref,
} from 'actions';

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

  [queryEntityExpand.START]: (state, { query }) => resultLoadStart(state, query),

  [queryEntityExpand.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),

  [queryEntityExpand.COMPLETE]: updateExpandResults,

  [queryNotifications.START]: (state, { query }) => resultLoadStart(state, query),

  [queryNotifications.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),

  [queryNotifications.COMPLETE]: updateResults,

  [queryEntitySets.START]: (state, { query }) => resultLoadStart(state, query),

  [queryEntitySets.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryEntitySets.COMPLETE]: updateResults,

  [queryCollectionXref.COMPLETE]: updateResults,

  [queryCollectionXref.START]: (state, { query }) => resultLoadStart(state, query),

  [queryCollectionXref.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryRoles.COMPLETE]: updateResults,

  [queryRoles.START]: (state, { query }) => resultLoadStart(state, query),

  [queryRoles.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

}, initialState);
