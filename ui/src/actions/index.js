import {endpoint} from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';

export const fetchMetadata = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('metadata');
  return { metadata: response.data };
}, { name: 'FETCH_METADATA' });

export const fetchSearchResults = asyncActionCreator(({ filters }) => async dispatch => {
  const response = await endpoint.get('search', { params: filters });
  return { filters, result: response.data };
}, { name: 'FETCH_SEARCH_RESULTS' });

export const fetchNextSearchResults = asyncActionCreator(({ next }) => async dispatch => {
  const response = await endpoint.get(next);
  return { result: response.data };
}, { name: 'FETCH_NEXT_SEARCH_RESULTS' });

export const fetchEntity = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY' });

export const fetchDocument = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`documents/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT' });

export const fetchCollection = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`collections/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION' });

export const fetchCollectionsPage = asyncActionCreator(({ page }) => async dispatch => {
  const limit = 5000;
  const response = await endpoint.get('collections', {
    params: { limit, offset: page * limit }
  });
  return { result: response.data };
}, { name: 'FETCH_COLLECTIONS_PAGE' });

export const fetchCollections = () => async dispatch => {
  let page = 0;
  let pages;
  do {
    const { result } = await dispatch(fetchCollectionsPage({ page }));
    pages = result.pages;
  } while (++page < pages);
};
