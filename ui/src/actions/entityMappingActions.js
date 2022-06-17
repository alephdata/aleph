// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryMappings = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_MAPPINGS' });

export const fetchEntityMapping = asyncActionCreator(({ id, collection }) => async () => {
  const response = await endpoint.get(`collections/${collection.id}/mappings?filter:table=${id}`, {});
  return { id, data: response.data.results[0] };
}, { name: 'FETCH_ENTITY_MAPPING' });

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
    await endpoint.delete(`collections/${collection.id}/mappings/${mappingId}`);
    return { id };
  }, { name: 'DELETE_ENTITY_MAPPING' },
);

export const flushEntityMapping = asyncActionCreator(
  ({ id, collection }, mappingId) => async () => {
    await endpoint.put(`collections/${collection.id}/mappings/${mappingId}/flush`);
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
