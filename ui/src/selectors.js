import _ from 'lodash';

import { documentRecordKey } from 'src/reducers/documentRecords';


function selectResult(state, query, expand) {
  const key = query.toKey();
  const result = {
    isLoading: false,
    shouldLoad: true,
    results: [],
    ...state.results[key]
  };
  result.results = result.results.map((id) => expand(state, id));
  return result;
}

function selectObject(objects, id) {
  if (!id || !_.has(objects, id)) {
    return {
      isLoading: false,
      shouldLoad: true,
    }
  }
  return objects[id];
}

export function selectMetadata(state) {
  return state.metadata;
}

export function selectStatistics(state) {
  return state.statistics;
}

export function selectSession(state) {
  return state.session;
}

export function selectAlerts(state) {
  return state.alerts;
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

export function selectDocumentPage(state, documentId, page) {
  const key = documentRecordKey(documentId, page);
  return selectObject(state.documentRecords, key);
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

export function selectCollectionPermissions(state, collectionId) {
  return selectObject(state.collectionPermissions, collectionId);
}

export function selectCollectionXrefIndex(state, collectionId) {
  return selectObject(state.collectionXrefIndex, collectionId);
}

export function selectCollectionXrefMatches(state, query) {
  return selectObject(state.collectionXrefMatches, query.toKey());
}
