// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { fetchCollectionPermissions, updateCollectionPermissions } from 'actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionPermissions.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchCollectionPermissions.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchCollectionPermissions.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

  [updateCollectionPermissions.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),

}, initialState);
