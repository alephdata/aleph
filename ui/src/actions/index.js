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
  deleteCollection
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
  deleteDocument
};

export const fetchMetadata = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('metadata');
  return { metadata: response.data };
}, { name: 'FETCH_METADATA' });

export const fetchStatistics = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });

export const setLocale = createAction('SET_LOCALE');
