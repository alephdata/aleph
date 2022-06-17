// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { queryNotifications } from 'actions';
import { resultObjects } from './util';

export default createReducer({
  [queryNotifications.COMPLETE]: (state, { result }) => resultObjects(state, result),
}, {});
