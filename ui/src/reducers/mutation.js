import { createReducer } from 'redux-act';

import timestamp from 'util/timestamp';

import {
  forceMutate,
  createCollection,
  updateCollection,
  deleteCollection,
  createEntityMapping,
  updateEntityMapping,
  deleteEntityMapping,
  triggerCollectionCancel,
  updateCollectionPermissions,
  createEntity,
  createEntitySetMutate,
  updateEntitySetItemMutate,
  deleteEntity,
  deleteEntitySet,
  updateRole,
  deleteAlert,
  createAlert,
  createBookmark,
  deleteBookmark,
  loginWithToken,
  logout,
} from 'actions';

const initialState = {
  global: timestamp(),
};

function update(state, key = 'global') {
  return {
    ...state,
    [key]: timestamp(),
  };
}

export default createReducer(
  {
    [forceMutate]: () => update(),
    [loginWithToken]: () => update(),
    [logout]: () => update(),
    // Clear out the redux cache when operations are performed that
    // may affect the content of the results.
    [createCollection.COMPLETE]: () => update(),
    [updateCollection.COMPLETE]: () => update(),
    [deleteCollection.COMPLETE]: () => update(),
    [createEntityMapping.COMPLETE]: () => update(),
    [updateEntityMapping.COMPLETE]: () => update(),
    [deleteEntityMapping.COMPLETE]: () => update(),
    [triggerCollectionCancel.COMPLETE]: () => update(),
    [updateCollectionPermissions.COMPLETE]: () => update(),
    [createEntity.COMPLETE]: () => update(),
    [createEntitySetMutate.COMPLETE]: () => update(),
    [updateEntitySetItemMutate.COMPLETE]: () => update(),
    [deleteEntity.COMPLETE]: () => update(),
    [deleteEntitySet.COMPLETE]: () => update(),
    [updateRole.COMPLETE]: () => update(),
    [createAlert.COMPLETE]: () => update(),
    [deleteAlert.COMPLETE]: () => update(),
    [createBookmark.COMPLETE]: (state) => update(state, 'bookmarks'),
    [deleteBookmark.COMPLETE]: (state) => update(state, 'bookmarks'),
  },
  initialState
);
