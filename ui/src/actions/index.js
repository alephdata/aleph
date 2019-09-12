import { createAction } from 'redux-act';

export { fetchRole, suggestRoles, updateRole } from './roleActions';
export { addAlert, deleteAlert, fetchAlerts } from './alertActions';
export { deleteNotifications, queryNotifications } from './notificationActions';
export { fetchDocumentContent, ingestDocument } from './documentActions';
export {
  createCollection,
  deleteCollection,
  fetchCollection,
  fetchCollectionStatus,
  fetchCollectionPermissions,
  fetchCollectionXrefIndex,
  queryCollections,
  queryXrefMatches,
  tiggerXrefMatches,
  triggerCollectionAnalyze,
  triggerCollectionCancel,
  updateCollection,
  updateCollectionPermissions,
} from './collectionActions';
export {
  fetchEntity, fetchEntityReferences, fetchEntityTags, queryEntities, deleteEntity,
} from './entityActions';
export { fetchMetadata, fetchStatistics } from './metadataActions';
export { queryDashboard } from './dashboardActions';

export { createAction };
export const setLocale = createAction('SET_LOCALE');
