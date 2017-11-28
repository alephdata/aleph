import axios from 'axios';
import queryString from 'query-string';
import store from 'store';

export const endpoint = axios.create({
  baseURL: 'http://localhost:5000/api/2',
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
