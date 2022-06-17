// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import axios from 'axios';
import queryString from 'query-string';

const apiEndpoint = document.documentElement.getAttribute('data-api-endpoint');

export const endpoint = axios.create({
  baseURL: apiEndpoint,
  headers: {},
  // Use non-bracket array params format
  paramsSerializer: queryString.stringify,
});
