var loadText = ['$http', '$q', '$location', '$route', 'Document',
    function($http, $q, $location, $route, Document) {
  
  var dfd = $q.defer(),
      pageNumber = $location.search().page,
      documentId = $route.current.params.document_id;

  Document.get(documentId).then(function(doc) {
    Document.getPage(documentId, pageNumber).then(function(page) {
      dfd.resolve({
        doc: doc,
        page: page,
      });  
    }, function(err) {
      dfd.reject(err);
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
