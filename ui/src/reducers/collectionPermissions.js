// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
