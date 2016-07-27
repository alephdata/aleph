var loadCollectionDocuments = ['$route', 'Document', function($route, Document) {
  var collectionId = $route.current.params.collection_id;
  return Document.search(collectionId);
}];
