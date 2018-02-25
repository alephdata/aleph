import { endpoint } from 'src/app/api';
import queryString from 'query-string';
import asyncActionCreator from './asyncActionCreator';
import { selectFacet } from 'src/selectors';

export const fetchMetadata = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('metadata');
  return { metadata: response.data };
}, { name: 'FETCH_METADATA' });

export const suggestRoles = asyncActionCreator((prefix, exclude) => async dispatch => {
  const query = queryString.stringify({prefix: prefix, exclude: exclude});
  const response = await endpoint.get(`roles/_suggest?${query}`);
  return response.data;
}, { name: 'SUGGEST_ROLES' });

export const updateCollection = asyncActionCreator((collection) => async dispatch => {
  const response = await endpoint.post(`collections/${collection.id}`, collection);
  return {collection: response.data};
}, {name: 'UPDATE_COLLECTION'});

export const fetchRole = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`roles/${id}`);
  return { role: response.data };
}, { name: 'FETCH_ROLE' });

export const addRole = asyncActionCreator((role) => async dispatch => {
  const response = await endpoint.post(`roles/${role.id}`, role);
  return {role: response.data};
}, {name: 'ADD_ROLE'});

export const fetchAlerts = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('alerts');
  response.data.results.reverse();
  return { alerts: response.data };
}, { name: 'FETCH_ALERTS' });

export const deleteAlert = asyncActionCreator((id) => async dispatch => {
  await endpoint.delete(`alerts/${id}`);
  return {};
}, { name: 'DELETE_ALERT' });

export const addAlert = asyncActionCreator((alert) => async dispatch => {
  await endpoint.post('alerts', alert);
  return {};
}, { name: 'ADD_ALERT' });

export const fetchCollectionPermissions = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`collections/${id}/permissions`);
  response.data.results.sort(function(first, second){
    return first.role.name < second.role.name ? -1 : 1;
  });
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const updateCollectionPermissions = asyncActionCreator((id, permissions) => async dispatch => {
  const response = await endpoint.post(`collections/${id}/permissions`, permissions);
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_PERMISSIONS' });

export const fetchCollectionXrefIndex = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`collections/${id}/xref`);
  return { id, data: response.data};
}, { name: 'FETCH_COLLECTION_XREF_INDEX' });

export const fetchCollectionXrefMatches = asyncActionCreator((id, otherId) => async dispatch => {
  const response = await endpoint.get(`collections/${id}/xref/${otherId}`);
  return { id, otherId, data: response.data};
}, { name: 'FETCH_COLLECTION_XREF_MATCHES' });

export const fetchStatistics = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });

export const fetchSearchResults = asyncActionCreator(({ query }) => async dispatch => {
  const response = await endpoint.get('search', { params: query.toParams() });
  return { query, result: response.data };
}, { name: 'FETCH_SEARCH_RESULTS' });

export const fetchNextSearchResults = asyncActionCreator(({ query, result }) => async dispatch => {
  const response = await endpoint.get(result.next);
  return { query, prevResult: result, nextResult: response.data };
}, { name: 'FETCH_NEXT_SEARCH_RESULTS' });

const defaultFacetValuesLimit = 10;
const facetValuesLimitIncreaseStep = 10;

const _fetchFacet = async ({ query, field, fetchTotal, fetchValues, valuesLimit }) => {
  const facetQuery = query
    .limit(0) // The limit of the results, not the facets.
    .clearFacets()
    .addFacet(field)
    .set('facet_total', fetchTotal)
    .set('facet_values', fetchValues)
    .set('facet_size', valuesLimit);
  const response = await endpoint.get('search', { params: facetQuery.toParams() });
  const result = response.data.facets[field];
  return result;
}

export const fetchFacet = asyncActionCreator(({ query, field, fetchTotal, fetchValues }) => async dispatch => {
  const valuesLimit = defaultFacetValuesLimit;
  const result = await _fetchFacet({ query, field, fetchTotal, fetchValues, valuesLimit });
  return { query, field, fetchTotal, fetchValues, result, valuesLimit };
}, { name: 'FETCH_FACET' });

export const fetchNextFacetValues = asyncActionCreator(({ query, field }) => async (dispatch, getState) => {
  // There is no back-end API for fetching subsequent facet values. We simply
  // run a new query with a higher limit.
  const prevLimit = selectFacet(getState(), { query, field }).valuesLimit;
  const valuesLimit = prevLimit + facetValuesLimitIncreaseStep;
  const result = await _fetchFacet({ query, field, fetchTotal: false, fetchValues: true, valuesLimit });
  return { query, field, result, valuesLimit };
}, { name: 'FETCH_NEXT_FACET_VALUES' });

export const fetchEntity = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY' });

export const fetchEntityReferences = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/references`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_REFERENCES' });

export const fetchEntityTags = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/tags`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_TAGS' });

export const fetchDocument = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`documents/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT' });

export const fetchCollection = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`collections/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_COLLECTION' });

export const fetchCollections = asyncActionCreator(({ filters }) => async dispatch => {
  const response = await endpoint.get('collections', { params: filters });
  return { filters, result: response.data };
}, { name: 'FETCH_COLLECTIONS' });

export const fetchDocumentRecords = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`/documents/${id}/records`);
  return { data: response.data };
}, { name: 'FETCH_DOCUMENT_RECORDS' });

export const fetchNextDocumentRecords = asyncActionCreator(({ next }) => async dispatch => {
  const response = await endpoint.get(next);
  return { data: response.data };
}, { name: 'FETCH_NEXT_DOCUMENT_RECORDS' });
