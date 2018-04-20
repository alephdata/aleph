import _ from 'lodash';

export function matchesKey(collectionId, otherId) {
  return collectionId + '*' + otherId;
}

function selectResult(state, query, expand) {
  const key = query.toKey();
  const result = {
    isLoading: false,
    results: [],
    ...state.results[key]
  };
  result.results = result.results.map((id) => expand(state, id));
  return result;
}

function selectObject(objects, id) {
  if (!id || !_.has(objects, id)) {
    return {isLoading: false}
  }
  return objects[id];
}

export function selectCollection(state, collectionId) {
  // get a collection from the store.
  return selectObject(state.collections, collectionId);
}

export function selectEntity(state, entityId) {
  // get a collection from the store.
  return selectObject(state.entities, entityId);
}

export function selectDocumentRecord(state, recordId) {
  // get a collection from the store.
  return selectObject(state.documentRecords, recordId);
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

export function selectEntityTags(state, entityId) {
  return selectObject(state.entityTags, entityId);
}

export function selectEntityReferences(state, entityId) {
  return selectObject(state.entityReferences, entityId);
}
