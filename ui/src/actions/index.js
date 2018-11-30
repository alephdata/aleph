import {createAction} from 'redux-act';
import {fetchRole, suggestRoles, updateRole} from './roleActions';
import {addAlert, deleteAlert, fetchAlerts} from './alertActions';
import {deleteNotifications, queryNotifications} from './notificationActions';
import {
  deleteDocument,
  fetchDocument,
  fetchDocumentContent,
  fetchDocumentPage,
  ingestDocument,
  queryDocumentRecords
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
  updateCollection,
  updateCollectionPermissions
} from './collectionActions';
import {fetchEntity, fetchEntityReferences, fetchEntityTags, queryEntities} from './entityActions';

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
  fetchDocument,
  queryDocumentRecords,
  fetchDocumentPage,
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
  tiggerXrefMatches
};

export {fetchMetadata, fetchStatistics} from './metadata'

export const setLocale = createAction('SET_LOCALE');
