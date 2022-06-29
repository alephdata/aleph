// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { fetchEntityMapping, createEntityMapping, deleteEntityMapping, queryMappings, updateEntityMapping } from 'actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntityMapping.START]: (state, {
    id,
  }) => objectLoadStart(state, id),

  [fetchEntityMapping.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchEntityMapping.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [createEntityMapping.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [updateEntityMapping.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [deleteEntityMapping.COMPLETE]: (state, {
    id,
  }) => objectDelete(state, id),

  [queryMappings.COMPLETE]: (state, { result }) => resultObjects(state, result),

}, initialState);
