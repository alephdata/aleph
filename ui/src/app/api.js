import axios from 'axios';
import queryString from 'query-string';

import store from './store';

const apiEndpoint = document.documentElement.getAttribute('data-api-endpoint');

export const endpoint = axios.create({
  baseURL: apiEndpoint,
  headers: {},
  // Use non-bracket array params format
  paramsSerializer: queryString.stringify
});

endpoint.interceptors.request.use(config => {
  const { session } = store.getState();
  if (session.loggedIn) {
    config.headers.common['Authorization'] = `Bearer ${session.token}`;
  }
  return config;
});
