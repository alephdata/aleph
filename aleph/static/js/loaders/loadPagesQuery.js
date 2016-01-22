
var loadPagesQuery = ['$route', '$location', 'Document', function($route, $location, Document) {
  return Document.queryPages($route.current.params.document_id, $location.search()); 
}];
