import Query from 'src/app/Query';


export function queryCollectionDocuments(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:parent': true
  };
  return Query.fromLocation('search', location, context, 'document').limit(50); 
}

