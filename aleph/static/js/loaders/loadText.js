var loadText = ['$http', '$q', '$route', 'Document',
    function($http, $q, $route, Document) {
  
  var dfd = $q.defer();
      documentId = $route.current.params.document_id,
      tableId = $route.current.params.table.id;

  Document.get(documentId).then(function(doc) {
    dfd.resolve(doc);
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
