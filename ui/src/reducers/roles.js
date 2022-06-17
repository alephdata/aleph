// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { queryRoles, fetchRole, updateRole } from 'actions';
import { resultObjects, objectLoadStart, objectLoadError, objectLoadComplete } from './util';

const initialState = {};


export default createReducer({
  [queryRoles.COMPLETE]: (state, { result }) => resultObjects(state, result),
  [fetchRole.START]: (state, { id }) => objectLoadStart(state, id),
  [fetchRole.ERROR]: (state, { error, args: { id } }) => objectLoadError(state, id, error),
  [fetchRole.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),
  [updateRole.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
