import { createAction } from 'redux-act';
import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { suggestRoles, fetchRole, updateRole } from './roleActions';
import { fetchAlerts, addAlert, deleteAlert } from './alertActions';
import { queryNotifications, deleteNotifications } from './notificationActions';
import {
  fetchDocument,
  queryDocumentRecords,
  fetchDocumentPage,
  fetchDocumentContent,
  ingestDocument,
  deleteDocument
} from './documentActions';
import {
  queryCollections,
  fetchCollection,
  updateCollection,
  fetchCollectionPermissions,
  updateCollectionPermissions,
  fetchCollectionXrefIndex,
  queryXrefMatches,
  createCollection,
  deleteCollection,
  tiggerXrefMatches
} from './collectionActions';
import {
  queryEntities,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags
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

export { fetchMetadata, fetchStatistics } from './metadata'

export const setLocale = createAction('SET_LOCALE');
