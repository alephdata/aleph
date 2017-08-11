import axios from 'axios';

export const endpoint = axios.create({
  baseURL: 'http://localhost:3000/api/2',
  headers: {}
});

export const setAuthHeader = function (value) {
  endpoint.defaults.headers.common['Authorization'] = value;
};
