import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';

export const fetchFacet = asyncActionCreator(({ query }) => async dispatch => {
  const response = await endpoint.get(query.path, { params: query.toParams() });
  return { query, result: response.data };
}, { name: 'FETCH_FACET' });
