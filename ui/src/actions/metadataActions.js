// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { endpoint } from 'app/api';
import asyncActionCreator from 'actions/asyncActionCreator';

export const fetchMetadata = asyncActionCreator(() => async () => {
  const response = await endpoint.get('metadata');
  return { metadata: response.data };
}, { name: 'FETCH_METADATA' });

export const fetchStatistics = asyncActionCreator(() => async () => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });

export const fetchSystemStatus = asyncActionCreator(() => async () => {
  const response = await endpoint.get('status');
  return { status: response.data };
}, { name: 'FETCH_SYSTEM_STATUS' });
