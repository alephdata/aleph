import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';

export const fetchMetadata = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('metadata');
  return { metadata: response.data };
}, { name: 'FETCH_METADATA' });

export const fetchUsers = asyncActionCreator((prefix) => async dispatch => {
  const response = await endpoint.get(`roles/_suggest?prefix=${prefix}`);
  return { users: response.data };
}, { name: 'FETCH_USERS' });

export const updateCollection = asyncActionCreator((collection) => async dispatch => {
  let id = collection.id === undefined ? collection.results[0][0].id : collection.id;
  const response = await endpoint.post(`collections/${id}`, collection);
  console.log('RESPONSE', response);
  return {collection: response.data};
}, {name: 'UPDATE_COLLECTION'});

export const fetchRole = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`roles/${id}`);
  return { role: response.data };
}, { name: 'FETCH_ROLE' });

export const addRole = asyncActionCreator((role) => async dispatch => {
  const response = await endpoint.post(`roles/${role.id}`, role);
  return {role: response.data};
}, {name: 'ADD_ROLE'});

export const fetchAlerts = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('alerts');
  response.data.results.reverse();
  return { alerts: response.data };
}, { name: 'FETCH_ALERTS' });

export const deleteAlert = asyncActionCreator((id) => async dispatch => {
  await endpoint.delete(`alerts/${id}`);
  return {};
}, { name: 'DELETE_ALERT' });

export const addAlert = asyncActionCreator((alert) => async dispatch => {
  await endpoint.post('alerts', alert);
  return {};
}, { name: 'ADD_ALERT' });

export const fetchCollectionPermissions = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`collections/${id}/permissions`);
  return {permissions: response.data};
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const fetchStatistics = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });

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

export const fetchEntityReferences = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/references`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_REFERENCES' });

export const fetchEntityTags = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/tags`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_TAGS' });

export const fetchDocument = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`documents/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT' });

export const fetchCollection = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`collections/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION' });

export const fetchCollections = asyncActionCreator(({ filters }) => async dispatch => {
  const response = await endpoint.get('collections', { params: filters });
  return { filters, result: response.data };
}, { name: 'FETCH_COLLECTIONS' });

export const fetchDocumentRecords = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`/documents/${id}/records`);
  return { data: response.data };
}, { name: 'FETCH_DOCUMENT_RECORDS' });

export const fetchNextDocumentRecords = asyncActionCreator(({ next }) => async dispatch => {
  const response = await endpoint.get(next);
  return { data: response.data };
}, { name: 'FETCH_NEXT_DOCUMENT_RECORDS' });
