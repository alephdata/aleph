// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
  const config = { params: { sync } };
  const payload = entity.toJSON();
  const response = await endpoint.put(`entitysets/${entitySetId}/entities`, payload, config);
  return { id: response.data.id, data: response.data };
}, { name: 'CREATE_ENTITY' });

export const fetchDiagramEmbed = asyncActionCreator((entitySetId) => async () => {
  const response = await endpoint.post(`entitysets/${entitySetId}/embed`);
  return response.data;
}, { name: 'FETCH_DIAGRAM_EMBED' });

export const queryEntitySetItems = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_ENTITYSET_ITEMS' });

const updateEntitySetItem = ({ entityId, entitySetId, judgement }) => async () => {
  const payload = { "entity_id": entityId, "judgement": judgement };
  const response = await endpoint.post(`entitysets/${entitySetId}/items`, payload);
  return { data: response.data };
};

export const updateEntitySetItemMutate = asyncActionCreator(updateEntitySetItem, { name: 'UPDATE_ESI_MUTATE' });
export const updateEntitySetItemNoMutate = asyncActionCreator(updateEntitySetItem, { name: 'UPDATE_ESI_NO_MUTATE' });
