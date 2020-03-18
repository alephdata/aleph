import { createAction } from 'redux-act';

export { fetchRole, suggestRoles, updateRole, fetchGroups } from './roleActions';
export { addAlert, deleteAlert, fetchAlerts } from './alertActions';
export { queryNotifications } from './notificationActions';
export { fetchDocumentContent, ingestDocument } from './documentActions';
export {
  createCollection,
  createCollectionMapping,
  deleteCollection,
  deleteCollectionMapping,
  fetchCollection,
  fetchCollectionStatistics,
  fetchCollectionStatus,
  fetchCollectionPermissions,
  fetchCollectionMappings,
  fetchCollectionXrefIndex,
  flushCollectionMapping,
  queryCollections,
  queryXrefMatches,
  tiggerXrefMatches,
  triggerCollectionAnalyze,
  triggerCollectionCancel,
  updateCollection,
  updateCollectionMapping,
  updateCollectionPermissions,
} from './collectionActions';
export {
  createDiagram,
  deleteDiagram,
  fetchDiagram,
  queryDiagrams,
  updateDiagram,
} from './diagramActions';
export {
  createEntity,
  deleteEntity,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
  queryEntities,
  updateEntity,
} from './entityActions';
export { fetchMetadata, fetchStatistics, fetchSystemStatus } from './metadataActions';
export { fetchQueryLogs, deleteQueryLog } from './queryLogsActions';

export { createAction };
export const setLocale = createAction('SET_LOCALE');
export const mutate = createAction('MUTATE');
