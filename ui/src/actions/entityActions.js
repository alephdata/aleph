import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryEntities = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_ENTITIES' }
);

export const querySimilar = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_SIMILAR' }
);

export const queryEntityExpand = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_ENTITY_EXPAND' }
);

export const fetchEntity = asyncActionCreator(
  ({ id }) =>
    async () => {
      const response = await endpoint.get(`entities/${id}`);
      return { id, data: response.data };
    },
  { name: 'FETCH_ENTITY' }
);

export const fetchEntityTags = asyncActionCreator(
  ({ id }) =>
    async () => {
      const response = await endpoint.get(`entities/${id}/tags`);
      return { id, data: response.data };
    },
  { name: 'FETCH_ENTITY_TAGS' }
);

export const createEntity = asyncActionCreator(
  ({ entity, collection_id }) =>
    async () => {
      const config = { params: { sync: true } };
      const payload = entity.toJSON();
      payload.collection_id = collection_id;
      const response = await endpoint.post(
        `entities/${entity.id}`,
        payload,
        config
      );
      return { id: response.data.id, data: response.data };
    },
  { name: 'CREATE_ENTITY' }
);

export const updateEntity = asyncActionCreator(
  (entity) => async () => {
    const config = { params: { sync: true } };
    const payload = entity.toJSON();
    const response = await endpoint.post(
      `entities/${entity.id}`,
      payload,
      config
    );
    return { id: response.data.id, data: response.data };
  },
  { name: 'UPDATE_ENTITY' }
);

export const deleteEntity = asyncActionCreator(
  (entityId) => async () => {
    const config = { params: { sync: true } };
    await endpoint.delete(`entities/${entityId}`, config);
    return { id: entityId };
  },
  { name: 'DELETE_ENTITY' }
);
