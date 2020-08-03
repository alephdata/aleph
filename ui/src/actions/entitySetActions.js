import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryEntitySets = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_ENTITYSETS' });

export const fetchEntitySet = asyncActionCreator((entitySetId) => async () => {
  const response = await endpoint.get(`entitysets/${entitySetId}`);
  return { entitySetId, data: response.data };
}, { name: 'FETCH_ENTITYSET' });

export const createEntitySet = asyncActionCreator((entitySet) => async () => {
  const response = await endpoint.post('entitysets', entitySet);
  const entitySetId = response.data.id;
  return { entitySetId, data: response.data };
}, { name: 'CREATE_ENTITYSET' });

export const updateEntitySet = (
  asyncActionCreator((entitySetId, entitySet) => async () => {
    const response = await endpoint.put(`entitysets/${entitySetId}`, entitySet);
    return { entitySetId, data: response.data };
  }, { name: 'UPDATE_ENTITYSET' })
);

export const deleteEntitySet = asyncActionCreator((entitySetId) => async () => {
  await endpoint.delete(`entitysets/${entitySetId}`);
  return { entitySetId };
}, { name: 'DELETE_ENTITYSET' });

export const entitySetCreateEntity = asyncActionCreator(({ entity, entitySetId }) => async () => {
  const config = {
    params: { sync: true }
  };
  const payload = entity.toJSON();
  const response = await endpoint.put(`entitysets/${entitySetId}/entities`, payload, config);
  return { id: response.data.id, data: response.data };
}, { name: 'CREATE_ENTITY' });
