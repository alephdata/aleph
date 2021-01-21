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
  loginWithToken,
  logout,
} from 'actions';

const initialState = timestamp();

function update() {
  return timestamp();
}

export default createReducer({
  [forceMutate]: update,
  [loginWithToken]: update,
  [logout]: update,
  // Clear out the redux cache when operations are performed that
  // may affect the content of the results.
  [createCollection.COMPLETE]: update,
  [updateCollection.COMPLETE]: update,
  [deleteCollection.COMPLETE]: update,
  [createEntityMapping.COMPLETE]: update,
  [updateEntityMapping.COMPLETE]: update,
  [deleteEntityMapping.COMPLETE]: update,
  [triggerCollectionCancel.COMPLETE]: update,
  [updateCollectionPermissions.COMPLETE]: update,
  [createEntity.COMPLETE]: update,
  [createEntitySetMutate.COMPLETE]: update,
  [updateEntitySetItemMutate.COMPLETE]: update,
  [deleteEntity.COMPLETE]: update,
  [deleteEntitySet.COMPLETE]: update,
  [updateRole.COMPLETE]: update,
  [createAlert.COMPLETE]: update,
  [deleteAlert.COMPLETE]: update,
}, initialState);
