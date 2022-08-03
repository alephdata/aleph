import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryCollections = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_COLLECTIONS' }
);

export const fetchCollection = asyncActionCreator(
  ({ id, refresh }) =>
    async () => {
      const config = { params: { refresh } };
      const response = await endpoint.get(`collections/${id}`, config);
      return { id, data: response.data };
    },
  { name: 'FETCH_COLLECTION' }
);

export const createCollection = asyncActionCreator(
  (collection) => async () => {
    const config = { params: { sync: true } };
    const response = await endpoint.post('collections', collection, config);
    return { id: response.id, data: response.data };
  },
  { name: 'CREATE_COLLECTION' }
);

export const updateCollection = asyncActionCreator(
  (collection) => async () => {
    const config = { params: { sync: true } };
    const response = await endpoint.post(
      `collections/${collection.id}`,
      collection,
      config
    );
    return { id: collection.id, data: response.data };
  },
  { name: 'UPDATE_COLLECTION' }
);

export const deleteCollection = asyncActionCreator(
  (collection) => async () => {
    const config = { params: { sync: false } };
    await endpoint.delete(`collections/${collection.id}`, config);
    return { id: collection.id };
  },
  { name: 'DELETE_COLLECTION' }
);

export const fetchCollectionPermissions = asyncActionCreator(
  (id) => async () => {
    const response = await endpoint.get(`collections/${id}/permissions`);
    response.data.results.sort((first, second) =>
      first.role.name < second.role.name ? -1 : 1
    );
    return { id, data: response.data };
  },
  { name: 'FETCH_COLLECTION_PERMISSIONS' }
);

export const updateCollectionPermissions = asyncActionCreator(
  (id, permissions) => async () => {
    const config = { params: { sync: true } };
    const response = await endpoint.post(
      `collections/${id}/permissions`,
      permissions,
      config
    );
    return { id, data: response.data };
  },
  { name: 'UPDATE_COLLECTION_PERMISSIONS' }
);

export const queryCollectionXref = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_XREF' }
);

export const triggerCollectionXref = asyncActionCreator(
  (id) => async () => {
    const response = await endpoint.post(`collections/${id}/xref`, {});
    return { data: response.data };
  },
  { name: 'TRIGGER_XREF' }
);

export const triggerCollectionXrefDownload = asyncActionCreator(
  (id) => async () => {
    const response = await endpoint.post(`collections/${id}/xref.xlsx`, {});
    return { data: response.data };
  },
  { name: 'TRIGGER_XREF_DOWNLOAD' }
);

export const triggerCollectionReingest = asyncActionCreator(
  (id, index) => async () => {
    const config = { params: { index } };
    const response = await endpoint.post(
      `collections/${id}/reingest`,
      null,
      config
    );
    return { data: response.data };
  },
  { name: 'TRIGGER_COLLECTION_REINGEST' }
);

export const triggerCollectionReindex = asyncActionCreator(
  (id, flush) => async () => {
    const config = { params: { flush } };
    const response = await endpoint.post(
      `collections/${id}/reindex`,
      null,
      config
    );
    return { data: response.data };
  },
  { name: 'TRIGGER_COLLECTION_REINDEX' }
);

export const triggerCollectionCancel = asyncActionCreator(
  (id) => async () => {
    const response = await endpoint.delete(`collections/${id}/status`);
    return { id, data: response.data };
  },
  { name: 'TRIGGER_COLLECTION_CANCEL' }
);
