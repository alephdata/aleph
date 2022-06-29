// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { fetchEntityTags, fetchProfileTags } from 'actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntityTags.START]: (state, { id }) => objectLoadStart(state, id),
  [fetchEntityTags.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),
  [fetchEntityTags.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),

  [fetchProfileTags.START]: (state, { id }) => objectLoadStart(state, id),
  [fetchProfileTags.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),
  [fetchProfileTags.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
