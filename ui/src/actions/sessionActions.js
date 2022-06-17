// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createAction } from 'redux-act';
import asyncActionCreator from './asyncActionCreator';
import { endpoint } from 'app/api';

export const loginWithToken = createAction('LOGIN');

export const loginWithPassword = (email, password) => async (dispatch) => {
  const response = await endpoint.post('/sessions/login', { email, password });
  dispatch(loginWithToken(response.data.token));
};

export const logout = asyncActionCreator(
  () => async () => {
    const response = await endpoint.post('/sessions/logout');
    return { redirect: response.data.redirect };
  },
  { name: 'LOGOUT' },
);