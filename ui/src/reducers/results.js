import { createReducer } from 'redux-act';

import {
  resultLoadStart, resultLoadError, updateResultIds, updateResults,
} from 'reducers/util';

import {
  queryCollections,
  queryEntitySets,
  queryEntitySetEntities,
  queryRoles,
  queryEntities,
  querySimilar,
  queryEntityExpand,
  queryProfileExpand,
  queryNotifications,
  queryCollectionXref,
  queryEntitySetItems,
  queryMappings,
} from 'actions';

const initialState = {};

export default createReducer({
  [queryCollections.START]: (state, { query }) => resultLoadStart(state, query),
  [queryCollections.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryCollections.COMPLETE]: updateResultIds,

  [queryEntities.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntities.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryEntities.COMPLETE]: updateResultIds,

  [querySimilar.START]: (state, { query }) => resultLoadStart(state, query),
  [querySimilar.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [querySimilar.COMPLETE]: updateResults,

  [queryEntityExpand.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntityExpand.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryEntityExpand.COMPLETE]: updateResults,

  [queryProfileExpand.START]: (state, { query }) => resultLoadStart(state, query),
  [queryProfileExpand.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryProfileExpand.COMPLETE]: updateResults,

  [queryNotifications.START]: (state, { query }) => resultLoadStart(state, query),
  [queryNotifications.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryNotifications.COMPLETE]: updateResultIds,

  [queryEntitySetEntities.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntitySetEntities.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryEntitySetEntities.COMPLETE]: updateResultIds,

  [queryEntitySets.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntitySets.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),
  [queryEntitySets.COMPLETE]: updateResultIds,

  [queryEntitySetItems.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntitySetItems.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),
  [queryEntitySetItems.COMPLETE]: updateResultIds,

  [queryCollectionXref.COMPLETE]: updateResults,
  [queryCollectionXref.START]: (state, { query }) => resultLoadStart(state, query),
  [queryCollectionXref.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryRoles.COMPLETE]: updateResultIds,
  [queryRoles.START]: (state, { query }) => resultLoadStart(state, query),
  [queryRoles.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryMappings.COMPLETE]: updateResultIds,
  [queryMappings.START]: (state, { query }) => resultLoadStart(state, query),
  [queryMappings.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

}, initialState);
