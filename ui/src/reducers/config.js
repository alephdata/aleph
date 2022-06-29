// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';
import { setConfigValue, setLocale } from 'actions';

const initialState = {};

export default createReducer({
  [setConfigValue]: (state, newVal) => ({ ...state.config, ...newVal }),
  [setLocale]: (state, { locale }) => ({ locale }),
}, initialState);
