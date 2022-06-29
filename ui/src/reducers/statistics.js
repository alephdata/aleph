// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { fetchStatistics } from 'actions';
import { loadState, loadStart, loadError, loadComplete } from 'reducers/util';

const initialState = loadState();

export default createReducer({
  [fetchStatistics.START]: (state) => loadStart(state),
  [fetchStatistics.ERROR]: (state, { error }) => loadError(state, error),
  [fetchStatistics.COMPLETE]: (state, { statistics }) => loadComplete(statistics),
}, initialState);
