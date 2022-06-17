// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
