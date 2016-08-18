var loadAnalysis = ['$http', '$q', '$location', '$route', 'Query',
    function($http, $q, $location, $route, Query) {
  
  var dfd = $q.defer(),
      collectionId = $route.current.params.collection_id,
      query = Query.parse();

  var data = angular.extend({'start_collection_id': collectionId, 'limit': 50}, query.state);
  $http.post('/api/1/graph/paths', data).then(function(res) {
    dfd.resolve({
      paths: res.data.results,
      collections: res.data.collections,
      query: query
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
