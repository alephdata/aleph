// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import {
  resultLoadStart, resultLoadError, updateResultsKeyed, updateResultsFull,
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
  queryAlerts,
} from 'actions';

const initialState = {};

export default createReducer({
  [queryCollections.START]: (state, { query }) => resultLoadStart(state, query),
  [queryCollections.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryCollections.COMPLETE]: updateResultsKeyed,

  [queryEntities.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntities.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryEntities.COMPLETE]: updateResultsKeyed,

  [querySimilar.START]: (state, { query }) => resultLoadStart(state, query),
  [querySimilar.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [querySimilar.COMPLETE]: updateResultsFull,

  [queryEntityExpand.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntityExpand.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryEntityExpand.COMPLETE]: updateResultsFull,

  [queryProfileExpand.START]: (state, { query }) => resultLoadStart(state, query),
  [queryProfileExpand.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryProfileExpand.COMPLETE]: updateResultsFull,

  [queryNotifications.START]: (state, { query }) => resultLoadStart(state, query),
  [queryNotifications.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryNotifications.COMPLETE]: updateResultsKeyed,

  [queryEntitySetEntities.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntitySetEntities.ERROR]:
    (state, { error, args: { query } }) => resultLoadError(state, query, error),
  [queryEntitySetEntities.COMPLETE]: updateResultsKeyed,

  [queryEntitySets.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntitySets.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),
  [queryEntitySets.COMPLETE]: updateResultsKeyed,

  [queryEntitySetItems.START]: (state, { query }) => resultLoadStart(state, query),
  [queryEntitySetItems.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),
  [queryEntitySetItems.COMPLETE]: updateResultsKeyed,

  [queryCollectionXref.COMPLETE]: updateResultsFull,
  [queryCollectionXref.START]: (state, { query }) => resultLoadStart(state, query),
  [queryCollectionXref.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryRoles.COMPLETE]: updateResultsKeyed,
  [queryRoles.START]: (state, { query }) => resultLoadStart(state, query),
  [queryRoles.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryAlerts.COMPLETE]: updateResultsFull,
  [queryAlerts.START]: (state, { query }) => resultLoadStart(state, query),
  [queryAlerts.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

  [queryMappings.COMPLETE]: updateResultsKeyed,
  [queryMappings.START]: (state, { query }) => resultLoadStart(state, query),
  [queryMappings.ERROR]: (state, {
    error, args: { query },
  }) => resultLoadError(state, query, error),

}, initialState);
