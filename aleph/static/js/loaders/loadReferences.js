var loadReferences = ['$http', '$q', '$location', '$route', 'Document',
    function($http, $q, $location, $route, Document) {
  
  var dfd = $q.defer(),
      documentId = $route.current.params.document_id;

  $http.get('/api/1/documents/' + documentId + '/references').then(function(res) {
    dfd.resolve(res.data.results);
  });
  return dfd.promise;
}];
