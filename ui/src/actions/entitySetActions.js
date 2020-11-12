import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryEntitySets = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_ENTITYSETS' });
export const queryEntitySetEntities = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_ENTITYSET_ENTITIES' });

export const fetchEntitySet = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entitysets/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITYSET' });

const createEntitySet = (entitySet) => async () => {
  const response = await endpoint.post('entitysets', entitySet);
  const entitySetId = response.data.id;
  return { entitySetId, data: response.data };
};

export const createEntitySetMutate = asyncActionCreator(createEntitySet, { name: 'CREATE_ENTITYSET_MUTATE' });
export const createEntitySetNoMutate = asyncActionCreator(createEntitySet, { name: 'CREATE_ENTITYSET_NO_MUTATE' });

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

export const entitySetAddEntity = asyncActionCreator(({ entity, entitySetId, sync }) => async () => {
  const config = {
    params: { sync }
  };
  const payload = entity.toJSON();
  const response = await endpoint.put(`entitysets/${entitySetId}/entities`, payload, config);
  return { id: response.data.id, data: response.data };
}, { name: 'CREATE_ENTITY' });

export const entitySetDeleteEntity = asyncActionCreator(({ entityId, entitySetId }) => async () => {
  const config = { params: { sync: true }};
  const payload = {"entity_id": entityId, "judgement": "no_judgement"};
  await endpoint.post(`entitysets/${entitySetId}/items`, payload, config);
  return { id: entityId };
}, { name: 'DELETE_ENTITY' });
