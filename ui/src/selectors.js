import { get } from 'lodash/fp';

export function selectResult(state, query) {
  return get([queryToResultKey(query)])(state.search);
}

export function selectFacet(state, { query, field }) {
  return get([field, queryToFacetKey(query, field)])(state.facets);
}

// Functions below are not selectors, but needed both here and in the reducers.
export function queryToResultKey(query) {
  // Strip the parts of the query that are irrelevant to the result cache.
  return query
    .clear('limit')
    .clear('offset')
    .toString()
}

export function queryToFacetKey(query, field) {
  if (!query) return null
    
  // Strip the parts of the query that are irrelevant to the facet cache.
  return query
    .clear('limit')
    .clear('offset')
    // Values in our field itself will not influence the facet results.
    .clearFilter(field)
    // And neither will sorting ever influence the aggregate values.
    .sortBy(null)
    .toString()
}

export function matchesKey(collectionId, otherId) {
  return collectionId + '*' + otherId;
}

export function getCollection(state, collectionId) {
  // get a collection from the store.
  const collection = state.collections[collectionId];
  return collection;
}

export function getEntityTags(state, entityId) {
  return state.entityTags[entityId];
}
