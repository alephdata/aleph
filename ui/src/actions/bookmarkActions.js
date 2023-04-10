import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryBookmarks = asyncActionCreator(
  (payload) => async () => queryEndpoint(payload),
  { name: 'QUERY_BOOKMARKS' }
);

export const createBookmark = asyncActionCreator(
  (entity) => async () =>
    await endpoint.post('bookmarks', { entity_id: entity.id }),
  { name: 'CREATE_BOOKMARK' }
);

export const deleteBookmark = asyncActionCreator(
  (entity) => async () => await endpoint.delete(`bookmarks/${entity.id}`),
  { name: 'DELETE_BOOKMARK' }
);
