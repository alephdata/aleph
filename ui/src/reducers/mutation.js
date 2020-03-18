import { createReducer } from 'redux-act';

import { timestamp } from 'src/reducers/util';

import {
  mutate,
  createCollection,
  updateCollection,
  deleteCollection,
  // executeFlush,
  // executeTrigger,
  createCollectionMapping,
  updateCollectionMapping,
  deleteCollectionMapping,
  createEntity,
  updateEntity,
  triggerCollectionCancel,
  // triggerCollectionAnalyze,
  updateCollectionPermissions,
  ingestDocument,
  deleteEntity,
  deleteQueryLog,
  updateRole,
} from 'src/actions';

const initialState = timestamp();

function update() {
  return timestamp();
}

export default createReducer({
  [mutate]: update,
  // Clear out the redux cache when operations are performed that
  // may affect the content of the results.
  [createCollection.COMPLETE]: update,
  [updateCollection.COMPLETE]: update,
  [deleteCollection.COMPLETE]: update,
  // [executeFlush.COMPLETE]: update,
  // [executeTrigger.COMPLETE]: update,
  [createCollectionMapping.COMPLETE]: update,
  [updateCollectionMapping.COMPLETE]: update,
  [deleteCollectionMapping.COMPLETE]: update,
  [triggerCollectionCancel.COMPLETE]: update,
  [updateCollectionPermissions.COMPLETE]: update,
  [createEntity.COMPLETE]: update,
  [updateEntity.COMPLETE]: update,
  [deleteEntity.COMPLETE]: update,
  [ingestDocument.COMPLETE]: update,
  [deleteQueryLog.COMPLETE]: update,
  [updateRole.COMPLETE]: update,

}, initialState);
