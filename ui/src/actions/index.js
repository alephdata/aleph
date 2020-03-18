import { createAction } from 'redux-act';

export {
  fetchRole,
  suggestRoles,
  updateRole,
  fetchGroups,
} from './roleActions';
export { addAlert, deleteAlert, fetchAlerts } from './alertActions';
export { queryNotifications } from './notificationActions';
export {
  fetchDocumentContent,
  ingestDocument,
  fetchDocumentProcessingReport,
} from './documentActions';
export {
  createCollection,
  deleteCollection,
  fetchCollection,
  fetchCollectionStatistics,
  fetchCollectionStatus,
  fetchCollectionProcessingReport,
  fetchCollectionPermissions,
  queryCollections,
  queryCollectionXref,
  triggerCollectionXref,
  triggerCollectionAnalyze,
  triggerCollectionCancel,
  updateCollection,
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
  createEntityMapping,
  deleteEntity,
  deleteEntityMapping,
  fetchEntity,
  fetchEntityMapping,
  fetchEntityReferences,
  fetchEntityTags,
  flushEntityMapping,
  queryEntities,
  updateEntity,
  updateEntityMapping,
} from './entityActions';
export {
  fetchMetadata,
  fetchStatistics,
  fetchSystemStatus,
} from './metadataActions';
export { fetchQueryLogs, deleteQueryLog } from './queryLogsActions';
export {
  queryProcessingTaskReports,
  triggerTaskReprocess,
  deleteProcessingJobReport,
} from './reportActions';

export { createAction };
export const setLocale = createAction('SET_LOCALE');
export const mutate = createAction('MUTATE');
