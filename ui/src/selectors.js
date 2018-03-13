
export function matchesKey(collectionId, otherId) {
  return collectionId + '*' + otherId;
}

export function selectResult(state, query, expand) {
  const key = query.toKey();
  const result = {
    isLoading: true,
    results: [],
    ...state.results[key]
  };
  result.results = result.results.map((id) => expand(state, id));
  return result;
}

export function selectCollection(state, collectionId) {
  // get a collection from the store.
  return state.collections[collectionId];
}

export function selectEntity(state, entityId) {
  // get a collection from the store.
  return state.entities[entityId];
}

export function selectDocumentRecord(state, recordId) {
  // get a collection from the store.
  return state.documentRecords[recordId];
}

export function selectCollectionsResult(state, query) {
  return selectResult(state, query, selectCollection);
}

export function selectEntitiesResult(state, query) {
  return selectResult(state, query, selectEntity);
}

export function selectDocumentRecordsResult(state, query) {
  return selectResult(state, query, selectDocumentRecord);
}

export function selectNotificationsResult(state, query) {
  return selectResult(state, query, (state, id) => state.notifications[id]);
}

export function getEntityTags(state, entityId) {
  return state.entityTags[entityId];
}
