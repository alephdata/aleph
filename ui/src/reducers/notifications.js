// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { queryNotifications } from 'actions';
import { resultObjects } from './util';

export default createReducer({
  [queryNotifications.COMPLETE]: (state, { result }) => resultObjects(state, result),
}, {});
