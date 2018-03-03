import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { suggestRoles, fetchRole, addRole } from './roleActions';
import { fetchAlerts, addAlert, deleteAlert } from './alertActions';
import {
  fetchDocument,
  fetchDocumentRecords,
  fetchNextDocumentRecords
} from './documentActions';
import {
  fetchCollections,
  queryCollections,
  fetchCollection,
  updateCollection,
  fetchCollectionPermissions,
  updateCollectionPermissions,
  fetchCollectionXrefIndex,
  fetchCollectionXrefMatches,
  fetchNextCollectionXrefMatches
} from './collectionActions';
import {
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
  fetchSearchResults,
  fetchNextSearchResults,
  fetchFacet,
  fetchNextFacetValues
} from './entityActions';


export {
  suggestRoles,
  fetchRole,
  addRole,
  fetchAlerts,
  addAlert,
  deleteAlert,
  fetchDocument,
  fetchDocumentRecords,
  fetchNextDocumentRecords,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
  fetchSearchResults,
  fetchNextSearchResults,
  fetchFacet,
  fetchNextFacetValues,
  fetchCollections,
  queryCollections,
  fetchCollection,
  updateCollection,
  fetchCollectionPermissions,
  updateCollectionPermissions,
  fetchCollectionXrefIndex,
  fetchCollectionXrefMatches,
  fetchNextCollectionXrefMatches
};

export const fetchMetadata = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('metadata');
  return { metadata: response.data };
}, { name: 'FETCH_METADATA' });

export const fetchStatistics = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });
