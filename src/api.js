import axios from 'axios';
import queryString from 'query-string';

export const endpoint = axios.create({
  baseURL: 'http://localhost:3000/api/2',
  headers: {},
  // Use non-bracket array params format
  paramsSerializer: queryString.stringify
});
