var loadDocumentsSearch = ['Document', function(Document) {
  return Document.search();
}];

var loadDocument = ['$http', '$q', '$route', '$location', 'Document',
    function($http, $q, $route, $location, Document) {

  var dfd = $q.defer(),
      documentId = $route.current.params.document_id;

  Document.get(documentId).then(function(doc) {
    dfd.resolve(doc);
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];

var loadDocumentChildren = ['$http', '$q', '$route', '$location', 'Document',
    function($http, $q, $route, $location, Document) {
  return Document.queryChildren($route.current.params.document_id, 0);
}];

export {loadDocumentsSearch, loadDocument, loadDocumentChildren};
