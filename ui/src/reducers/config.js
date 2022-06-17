// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';
import { setConfigValue, setLocale } from 'actions';

const initialState = {};

export default createReducer({
  [setConfigValue]: (state, newVal) => ({ ...state.config, ...newVal }),
  [setLocale]: (state, { locale }) => ({ locale }),
}, initialState);
