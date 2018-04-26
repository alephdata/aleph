import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryCollections = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_COLLECTIONS' });

export const fetchCollection = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`collections/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION' });

export const updateCollection = asyncActionCreator((collection) => async dispatch => {
  const response = await endpoint.post(`collections/${collection.id}`, collection);
  return {id: collection.id, data: response.data};
}, {name: 'UPDATE_COLLECTION'});

export const createCollection = asyncActionCreator((collection) => async dispatch => {
  const response = await endpoint.post(`collections`, collection);
  return {data: response.data};
}, {name: 'CREATE_COLLECTION'});

export const fetchCollectionPermissions = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`collections/${id}/permissions`);
  response.data.results.sort(function(first, second){
    return first.role.name < second.role.name ? -1 : 1;
  });
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const updateCollectionPermissions = asyncActionCreator((id, permissions) => async dispatch => {
  const response = await endpoint.post(`collections/${id}/permissions`, permissions);
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const fetchCollectionXrefIndex = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`collections/${id}/xref`);
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_XREF_INDEX' });

export const queryXrefMatches = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_XREF_MATCHES' });
