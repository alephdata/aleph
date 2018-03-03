import { get } from 'lodash/fp';

export function selectFacet(state, { query, field }) {
  return get([field, queryToFacetKey(query, field)])(state.facets);
}

export function queryToFacetKey(query, field) {
  if (!query) return null
    
  // Strip the parts of the query that are irrelevant to the facet cache.
  return query
    .clear('limit')
    // Values in our field itself will not influence the facet results.
    .clearFilter(field)
    // And neither will sorting ever influence the aggregate values.
    .sortBy(null)
    .toKey()
}

export function matchesKey(collectionId, otherId) {
  return collectionId + '*' + otherId;
}


export function selectResult(state, query) {
  const key = query.toKey();
  const loading = {
    isLoading: true,
    results: []
  };
  return state.results[key] || loading;
}

export function selectCollection(state, collectionId) {
  // get a collection from the store.
  const collection = state.collections[collectionId];
  return collection;
}

export function selectCollectionsResult(state, query) {
  return selectResult(state, query);
}

export function selectEntitiesResult(state, query) {
  return selectResult(state, query);
}

export function getEntityTags(state, entityId) {
  return state.entityTags[entityId];
}
