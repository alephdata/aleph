import { createReducer } from 'redux-act';

import timestamp from 'util/timestamp';

import {
  mutate,
  createCollection,
  updateCollection,
  deleteCollection,
  createEntityMapping,
  updateEntityMapping,
  deleteEntityMapping,
  triggerCollectionCancel,
  updateCollectionPermissions,
  ingestDocument,
  createEntity,
  deleteEntity,
  deleteQueryLog,
  updateRole,
  loginWithToken,
  logout,
} from 'actions';

const initialState = timestamp();

function update() {
  return timestamp();
}

export default createReducer({
  [mutate]: update,
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
  [deleteEntity.COMPLETE]: update,
  [ingestDocument.COMPLETE]: update,
  [deleteQueryLog.COMPLETE]: update,
  [updateRole.COMPLETE]: update,
}, initialState);
