import Query from 'src/app/Query';


export function queryCollectionDocuments(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:parent': true
  };
  return Query.fromLocation('entities', location, context, 'document').limit(50); 
}

export function queryFolderDocuments(location, documentId, queryText) {
  // when a query is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
  const q = Query.fromLocation('entities', location, {}, 'document').getString('q'),
        hasSearch = (q.length !== 0 || queryText),
        context = {'filter:schemata': 'Document'} && {};
    context['filter:properties.document'] = documentId;

  let query = Query.fromLocation('entities', location, context, 'document').limit(50);
  if (queryText) {
    query = query.setString('q', queryText);
  }
  return query;
};


export function queryEntitySimilar(location, entityId) {
  const path = entityId ? `entities/${entityId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar').limit(50);
}