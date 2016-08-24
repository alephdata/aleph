
var loadPaths = ['$http', '$q', '$location', '$route', 'Query',
    function($http, $q, $location, $route, Query) {
  var dfd = $q.defer(),
      collectionId = $route.current.params.collection_id,
      query = Query.parse();

  var url = '/api/1/collections/' + collectionId + '/paths',
      params = {params: query.state};
  $http.get(url, params).then(function(res) {
    dfd.resolve({
      data: res.data,
      query: query
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
