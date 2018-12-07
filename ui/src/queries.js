import Query from 'src/app/Query';


export function queryCollectionDocuments(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:parent': true
  };
  return Query.fromLocation('entities', location, context, 'document').limit(50); 
}

export function queryEntitySimilar(location, entityId) {
  const path = entityId ? `entities/${entityId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar').limit(50);
}