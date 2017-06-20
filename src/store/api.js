import axios from 'axios';
// import queryString from 'query-string';

// const buildURL = (endpoint, params) => {
//   let extra = queryString.stringify(params);
//   extra = extra ? '?' + extra : '';
//
//   return `${endpoint}${extra}`;
// }

export const endpoint = axios.create({
  baseURL: 'http://localhost:3000/api/2',
  headers: {}
});
