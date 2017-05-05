import queryString from 'query-string';

const buildURL = (endpoint, params) => {
  let extra = queryString.stringify(params);
  extra = extra ? '?' + extra : '';

  return `${endpoint}${extra}`;
}

export const getDocuments = (params) => {
  return fetch(buildURL('/api/documents', params));
}