import { createAction } from 'redux-act';

export { queryRoles, fetchRole, suggestRoles, updateRole } from './roleActions';
export { addAlert, deleteAlert, fetchAlerts } from './alertActions';
export { queryNotifications } from './notificationActions';
export { setConfigValue } from './configActions';
export { ingestDocument } from './documentActions';
export {
  createCollection,
  deleteCollection,
  fetchCollection,
  fetchCollectionStatus,
  fetchCollectionPermissions,
  queryCollections,
  queryCollectionXref,
  triggerCollectionXref,
  triggerCollectionXrefDownload,
  decideCollectionXref,
  triggerCollectionReingest,
  triggerCollectionReindex,
  triggerCollectionCancel,
  updateCollection,
  updateCollectionPermissions,
} from './collectionActions';
export {
  createEntity,
  deleteEntity,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
  queryEntities,
  queryEntityExpand,
  updateEntity,
} from './entityActions';
export {
  createEntityMapping,
  deleteEntityMapping,
  fetchEntityMapping,
  flushEntityMapping,
  updateEntityMapping,
} from './entityMappingActions';
export {
  createEntitySetMutate,
  createEntitySetNoMutate,
  deleteEntitySet,
  entitySetAddEntity,
  entitySetDeleteEntity,
  fetchEntitySet,
  queryEntitySets,
  queryEntitySetEntities,
  updateEntitySet,
} from './entitySetActions';
export { fetchMetadata, fetchStatistics, fetchSystemStatus } from './metadataActions';
export { fetchQueryLogs, deleteQueryLog } from './queryLogsActions';
export { loginWithToken, loginWithPassword, logout } from './sessionActions';
export { fetchExports, triggerQueryExport } from './exportActions';

export { createAction };
export const setLocale = createAction('SET_LOCALE');
export const mutate = createAction('MUTATE');
