// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';
import { fetchMetadata } from 'actions';
import { loadState, loadStart, loadError, loadComplete } from 'reducers/util';

const initialState = loadState();

export default createReducer({
  [fetchMetadata.START]: (state) => loadStart(state),
  [fetchMetadata.ERROR]: (state, { error }) => loadError(state, error),
  [fetchMetadata.COMPLETE]: (state, { metadata }) => loadComplete(metadata),
}, initialState);
