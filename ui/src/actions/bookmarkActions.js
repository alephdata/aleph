import asyncActionCreator from './asyncActionCreator';

export const createBookmark = asyncActionCreator((id) => async () => id, {
  name: 'CREATE_BOOKMARK',
});

export const deleteBookmark = asyncActionCreator((id) => async () => id, {
  name: 'DELETE_BOOKMARK',
});
