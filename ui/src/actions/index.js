import { createAction } from 'redux-act';
import { fetchRole, suggestRoles, updateRole } from './roleActions';
import { addAlert, deleteAlert, fetchAlerts } from './alertActions';
import { deleteNotifications, queryNotifications } from './notificationActions';
import {
  deleteDocument,
  fetchDocumentContent,
  ingestDocument,
} from './documentActions';
import {
  createCollection,
  deleteCollection,
  fetchCollection,
  fetchCollectionPermissions,
  fetchCollectionXrefIndex,
  queryCollections,
  queryXrefMatches,
  tiggerXrefMatches,
  triggerCollectionAnalyze,
  updateCollection,
  updateCollectionPermissions,
} from './collectionActions';
import {
  fetchEntity, fetchEntityReferences, fetchEntityTags, queryEntities,
} from './entityActions';

export {
  suggestRoles,
  fetchRole,
  updateRole,
  fetchAlerts,
  addAlert,
  deleteAlert,
  queryEntities,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
  fetchDocumentContent,
  queryCollections,
  fetchCollection,
  updateCollection,
  fetchCollectionPermissions,
  updateCollectionPermissions,
  fetchCollectionXrefIndex,
  queryXrefMatches,
  queryNotifications,
  createCollection,
  deleteCollection,
  deleteNotifications,
  ingestDocument,
  deleteDocument,
  triggerCollectionAnalyze,
  tiggerXrefMatches,
};

export { fetchMetadata, fetchStatistics } from './metadataActions';

export const setLocale = createAction('SET_LOCALE');
