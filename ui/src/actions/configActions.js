// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createAction } from 'redux-act';

export const setConfigValue = createAction('SET_CONFIG_VALUE')

export const dispatchSetConfigValue = (value) => (dispatch) => dispatch(setConfigValue(value))
