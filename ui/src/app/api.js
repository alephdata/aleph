// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
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
