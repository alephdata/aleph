import asyncActionCreator from './asyncActionCreator';

export const createBookmark = asyncActionCreator(
  (entity) => async () => entity,
  {
    name: 'CREATE_BOOKMARK',
  }
);

export const deleteBookmark = asyncActionCreator(
  (entity) => async () => entity,
  {
    name: 'DELETE_BOOKMARK',
  }
);
