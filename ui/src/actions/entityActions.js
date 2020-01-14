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
  console.log('in actions -> createEntity', entity);
  const response = await endpoint.post('entities', entity, {});
  console.log('response is', response);
  return response.data;
}, { name: 'CREATE_ENTITY' });

export const updateEntity = asyncActionCreator(({ id }) => async () => {
  const config = { params: { sync: true } };
  await endpoint.put(`entities/${id}`, config);
  return { id };
}, { name: 'UPDATE_ENTITY' });

export const deleteEntity = asyncActionCreator(({ id }) => async () => {
  const config = { params: { sync: true } };
  await endpoint.delete(`entities/${id}`, config);
  return { id };
}, { name: 'DELETE_ENTITY' });
