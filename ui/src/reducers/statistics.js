// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
