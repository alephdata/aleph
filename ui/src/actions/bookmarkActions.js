import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';

export const createBookmark = asyncActionCreator(
  (entity) => async () => {
    await endpoint.post('bookmarks');
    return entity;
  },
  { name: 'CREATE_BOOKMARK' }
);

export const deleteBookmark = asyncActionCreator(
  (entity) => async () => {
    await endpoint.delete('bookmarks/123');
    return entity;
  },
  { name: 'DELETE_BOOKMARK' }
);
