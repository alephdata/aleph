// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryRoles = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_ROLES' });

export const suggestRoles = asyncActionCreator((prefix, exclude) => async () => {
  const params = { 'exclude:id': exclude, prefix }
  const response = await endpoint.get('roles/_suggest', { params });
  return response.data;
}, { name: 'SUGGEST_ROLES' });

export const fetchRole = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`roles/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_ROLE' });

export const updateRole = asyncActionCreator((role) => async () => {
  const response = await endpoint.post(`roles/${role.id}`, role);
  return { id: role.id, data: response.data };
}, { name: 'UPDATE_ROLE' });
