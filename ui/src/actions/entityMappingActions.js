import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchEntityMapping = asyncActionCreator(({ id, collection }) => async () => {
  const response = await endpoint.get(`collections/${collection.id}/mappings?filter:table=${id}`, {});
  return { id, data: response.data.results[0] };
}, { name: 'FETCH_ENTITY_MAPPING' });

const executeFlush = async (collectionId, mappingId) => (
  endpoint.put(`collections/${collectionId}/mappings/${mappingId}/flush`)
);

const executeTrigger = async (collectionId, mappingId) => (
  endpoint.put(`collections/${collectionId}/mappings/${mappingId}/trigger`)
);

export const createEntityMapping = asyncActionCreator(({ id, collection }, mapping) => async () => {
  const response = await endpoint.post(`collections/${collection.id}/mappings`, mapping);
  if (response && response.data && response.data.id) {
    executeTrigger(collection.id, response.data.id);
  }
  return { id, data: response.data };
}, { name: 'CREATE_ENTITY_MAPPING' });

export const deleteEntityMapping = asyncActionCreator(
  ({ id, collection }, mappingId) => async () => {
    executeFlush(collection.id, mappingId);
    endpoint.delete(`collections/${collection.id}/mappings/${mappingId}`);
    return { id };
  }, { name: 'DELETE_ENTITY_MAPPING' },
);

export const flushEntityMapping = asyncActionCreator(
  ({ id, collection }, mappingId) => async () => {
    executeFlush(collection.id, mappingId);
    return { id };
  }, { name: 'FLUSH_COLLECTION_MAPPING' },
);

export const updateEntityMapping = asyncActionCreator(
  ({ id, collection }, mappingId, mapping) => async () => {
    const response = await endpoint.put(`collections/${collection.id}/mappings/${mappingId}`, mapping);
    executeTrigger(collection.id, mappingId);
    return { id, data: response.data };
  }, { name: 'UPDATE_COLLECTION_MAPPING' },
);
