// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { queryEntitySets, fetchEntitySet, fetchProfile, updateEntitySet, createEntitySetMutate, createEntitySetNoMutate, deleteEntitySet } from 'actions';
import { objectLoadComplete, objectLoadError, objectLoadStart, objectDelete, resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer({
  [queryEntitySets.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchEntitySet.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchEntitySet.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchEntitySet.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [fetchProfile.START]: (state, {
    id
  }) => objectLoadStart(state, id),

  [fetchProfile.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchProfile.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [createEntitySetMutate.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [createEntitySetNoMutate.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [updateEntitySet.COMPLETE]: (state, {
    entitySetId, data,
  }) => objectLoadComplete(state, entitySetId, data),

  [deleteEntitySet.COMPLETE]: (state, {
    entitySetId,
  }) => objectDelete(state, entitySetId),

}, initialState);
