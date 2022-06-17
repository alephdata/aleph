// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
