import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint, MAX_RESULTS } from './util';

export const queryCollections = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_COLLECTIONS' });


export const fetchCollection = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`collections/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION' });

export const createCollection = asyncActionCreator(collection => async () => {
  const config = { params: { sync: true } };
  const response = await endpoint.post('collections', collection, config);
  return { id: response.id, data: response.data };
}, { name: 'CREATE_COLLECTION' });

export const updateCollection = asyncActionCreator(collection => async () => {
  const config = { params: { sync: true } };
  const response = await endpoint.post(`collections/${collection.id}`, collection, config);
  return { id: collection.id, data: response.data };
}, { name: 'UPDATE_COLLECTION' });

export const deleteCollection = asyncActionCreator(collection => async () => {
  const config = { params: { sync: true } };
  await endpoint.delete(`collections/${collection.id}`, config);
  return { id: collection.id };
}, { name: 'DELETE_COLLECTION' });

export const fetchCollectionPermissions = asyncActionCreator(id => async () => {
  const response = await endpoint.get(`collections/${id}/permissions`);
  response.data.results.sort((first, second) => (first.role.name < second.role.name ? -1 : 1));
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const fetchCollectionStatus = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`collections/${id}/status`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION_STATUS' });

export const updateCollectionPermissions = asyncActionCreator((id, permissions) => async () => {
  const config = { params: { sync: true } };
  const response = await endpoint.post(`collections/${id}/permissions`, permissions, config);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const fetchCollectionXrefIndex = asyncActionCreator(({ id }) => async () => {
  const config = { params: { limit: MAX_RESULTS } };
  const response = await endpoint.get(`collections/${id}/xref`, config);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION_XREF_INDEX' });

export const queryXrefMatches = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_XREF_MATCHES' });

export const tiggerXrefMatches = asyncActionCreator((id, againstCollectionIds) => async () => {
  let data = null;
  if (againstCollectionIds && againstCollectionIds.length > 0) {
    data = { against_collection_ids: againstCollectionIds };
  }
  const response = await endpoint.post(`collections/${id}/xref`, data);
  return { data: response.data };
}, { name: 'TRIGGER_XREF_MATCHES' });

export const triggerCollectionAnalyze = asyncActionCreator(id => async () => {
  const response = await endpoint.post(`collections/${id}/process`);
  return { data: response.data };
}, { name: 'TRIGGER_COLLECTION_ANALYZE' });

export const triggerCollectionCancel = asyncActionCreator(id => async () => {
  const response = await endpoint.delete(`collections/${id}/status`);
  return { id, data: response.data };
}, { name: 'TRIGGER_COLLECTION_CANCEL' });

export const createCollectionMapping = asyncActionCreator((collectionId, mapping) => async () => {
  const response = await endpoint.post(`collections/${collectionId}/mappings`, mapping);
  if (response && response.data && response.data.id) {
    await endpoint.put(`collections/${collectionId}/mappings/${response.data.id}/trigger`);
  }
  return { collectionId, data: response.data };
}, { name: 'CREATE_COLLECTION_MAPPING' });

export const updateCollectionMapping = (
  asyncActionCreator((collectionId, mappingId, mapping) => async () => {
    const config = { params: { flush: true } };
    const response = await endpoint.put(`collections/${collectionId}/mappings/${mappingId}`, mapping, config);
    return { collectionId, mappingId, data: response.data };
  }, { name: 'UPDATE_COLLECTION_MAPPING' })
);

export const deleteCollectionMapping = asyncActionCreator((collectionId, mappingId) => async () => {
  const config = { params: { flush: true } };
  const response = await endpoint.delete(`collections/${collectionId}/mappings/${mappingId}`, config);
  return { collectionId, mappingId, data: response.data };
}, { name: 'DELETE_COLLECTION_MAPPING' });

export const flushCollectionMapping = asyncActionCreator((collectionId, mappingId) => async () => {
  const response = await endpoint.put(`collections/${collectionId}/mappings/${mappingId}/flush`);
  return { collectionId, mappingId, data: response.data };
}, { name: 'FLUSH_COLLECTION_MAPPING' });

export const fetchCollectionMapping = asyncActionCreator((collectionId, entityId) => async () => {
  const response = await endpoint.get(`collections/${collectionId}/mappings?filter:table=${entityId}`);
  return { collectionId, data: response.data.results };
}, { name: 'FETCH_COLLECTION_MAPPING' });
