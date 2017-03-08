var loadDocumentsSearch = ['Document', function(Document) {
  return Document.search();
}];

var loadPeek = ['Document', function(Document) {
  return Document.peek();
}];

var loadDocument = ['$http', '$q', '$route', '$location', 'Document',
    function($http, $q, $route, $location, Document) {

  var dfd = $q.defer(),
      documentId = $route.current.params.document_id;

  Document.get(documentId).then(function(doc) {
    var table = null;
    dfd.resolve(doc);
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];

export {loadDocumentsSearch, loadDocument, loadPeek};
