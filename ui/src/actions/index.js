import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { suggestRoles, fetchRole, addRole } from './roleActions';
import { fetchAlerts, addAlert, deleteAlert } from './alertActions';
import {
  fetchDocument,
  queryDocumentRecords,
} from './documentActions';
import {
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
  queryEntities,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
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
  queryEntities,
  fetchEntity,
  fetchEntityReferences,
  fetchEntityTags,
  fetchDocument,
  queryDocumentRecords,
  fetchFacet,
  fetchNextFacetValues,
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
