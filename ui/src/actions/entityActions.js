import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryEntities = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_ENTITIES' });


export const fetchEntity = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entities/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY' });


export const fetchEntityReferences = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entities/${id}/references`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_REFERENCES' });


export const fetchEntityTags = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entities/${id}/tags`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_TAGS' });

export const createEntity = asyncActionCreator(entity => async () => {
  const response = await endpoint.post('entities', entity, {});
  return response.data;
}, { name: 'CREATE_ENTITY' });

export const updateEntity = asyncActionCreator(({ entity, collectionId }) => async () => {
  const payload = entity.toJSON();
  payload.collection_id = collectionId;
  const response = await endpoint.put(`entities/${entity.id}`, payload, {});
  return response.data;
}, { name: 'UPDATE_ENTITY' });

export const deleteEntity = asyncActionCreator(entity => async () => {
  await endpoint.delete(`entities/${entity.id}`, {});
  return { id: entity.id };
}, { name: 'DELETE_ENTITY' });

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
