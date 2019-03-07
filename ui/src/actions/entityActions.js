import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint, resultEntities, resultEntity } from './util';


export const queryEntities = asyncActionCreator(query => async (dispatch, getState) => {
  const payload = await queryEndpoint(query);
  if (payload.result.results) {
    return {
      ...payload,
      result: resultEntities(getState(), payload.result),
    };
  }
  return payload;
}, { name: 'QUERY_ENTITIES' });


export const fetchEntity = asyncActionCreator(({ id }) => async (dispatch, getState) => {
  const response = await endpoint.get(`entities/${id}`);
  return { id, data: resultEntity(getState(), response.data) };
}, { name: 'FETCH_ENTITY' });


export const fetchEntityReferences = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entities/${id}/references`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_REFERENCES' });


export const fetchEntityTags = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entities/${id}/tags`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_TAGS' });
