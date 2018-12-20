import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint, MAX_RESULTS } from './util';


export const queryCollections = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_COLLECTIONS' });


export const fetchCollection = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`collections/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION' });


export const createCollection = asyncActionCreator((collection) => async dispatch => {
  const config = {params: {sync: true}};
  const response = await endpoint.post(`collections`, collection, config);
  return {id: response.id, data: response.data};
}, {name: 'CREATE_COLLECTION'});


export const updateCollection = asyncActionCreator((collection) => async dispatch => {
  const config = {params: {sync: true}};
  const response = await endpoint.post(`collections/${collection.id}`, collection, config);
  return {id: collection.id, data: response.data};
}, {name: 'UPDATE_COLLECTION'});


export const deleteCollection = asyncActionCreator((collection) => async dispatch => {
  await endpoint.delete(`collections/${collection.id}`, collection);
  return {id: collection.id};
}, {name: 'DELETE_COLLECTION'});


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
  const config = {params: {limit: MAX_RESULTS}};
  const response = await endpoint.get(`collections/${id}/xref`, config);
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_XREF_INDEX' });


export const queryXrefMatches = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_XREF_MATCHES' });


export const tiggerXrefMatches = asyncActionCreator((id, againstCollectionIds) => async dispatch => {
  let data = null;
  if (againstCollectionIds && againstCollectionIds.length > 0) {
    data = { "against_collection_ids": againstCollectionIds }
  }
  const response = await endpoint.post(`collections/${id}/xref`, data);
  return { data: response.data };
}, {name: 'TRIGGER_XREF_MATCHES'});

export const triggerCollectionAnalyze = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.post(`collections/${id}/process`);
  return { data: response.data };
}, {name: 'TRIGGER_COLLECTION_ANALYZE'});