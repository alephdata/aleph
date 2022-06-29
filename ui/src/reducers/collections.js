// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import {
  fetchCollection,
  updateCollection,
  queryCollections,
  createCollection,
  deleteCollection,
} from 'actions';
import {
  objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects,
} from 'reducers/util';

const initialState = {};


export default createReducer({
  [queryCollections.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchCollection.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchCollection.ERROR]: (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchCollection.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [updateCollection.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [createCollection.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),

  [deleteCollection.COMPLETE]: (state, { id }) => objectDelete(state, id),
}, initialState);
