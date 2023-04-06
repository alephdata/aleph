import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';

export const createBookmark = asyncActionCreator(
  (entity) => async () =>
    await endpoint.post('bookmarks', { entity_id: entity.id }),
  { name: 'CREATE_BOOKMARK' }
);

export const deleteBookmark = asyncActionCreator(
  (entity) => async () => await endpoint.delete(`bookmarks/${entity.id}`),
  { name: 'DELETE_BOOKMARK' }
);
