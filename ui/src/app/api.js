import axios from 'axios';
import queryString from 'query-string';

const apiEndpoint = document.documentElement.getAttribute('data-api-endpoint');

export const endpoint = axios.create({
  baseURL: apiEndpoint,
  headers: {},
  // Use non-bracket array params format
  paramsSerializer: queryString.stringify,
});
