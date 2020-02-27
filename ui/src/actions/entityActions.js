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
