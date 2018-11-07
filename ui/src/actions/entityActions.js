import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryEntities = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_ENTITIES' });


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
