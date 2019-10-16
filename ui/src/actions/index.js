import { createAction } from 'redux-act';

export { fetchRole, suggestRoles, updateRole, fetchGroups } from './roleActions';
export { addAlert, deleteAlert, fetchAlerts } from './alertActions';
export { deleteNotifications, queryNotifications } from './notificationActions';
export { fetchDocumentContent, ingestDocument } from './documentActions';
export {
  createCollection,
  deleteCollection,
  fetchCollection,
  fetchCollectionStatus,
  fetchCollectionPermissions,
  fetchCollectionMappings,
  fetchCollectionXrefIndex,
  queryCollections,
  queryXrefMatches,
  tiggerXrefMatches,
  triggerCollectionAnalyze,
  triggerCollectionCancel,
  updateCollection,
  updateCollectionPermissions,
  makeMapping,
} from './collectionActions';
export {
  fetchEntity, fetchEntityReferences, fetchEntityTags, queryEntities, deleteEntity,
} from './entityActions';
export { fetchMetadata, fetchStatistics, fetchSystemStatus } from './metadataActions';
export { fetchQueryLogs, deleteQueryLog } from './queryLogsActions';

export { createAction };
export const setLocale = createAction('SET_LOCALE');
