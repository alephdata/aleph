
var loadPaths = ['$http', '$q', '$location', '$route', 'Query',
    function($http, $q, $location, $route, Query) {
  var dfd = $q.defer(),
      collectionId = $route.current.params.collection_id,
      query = Query.parse();

  var url = '/api/1/collections/' + collectionId + '/paths',
      params = {params: query.state};
  params.limit = 50;
  $http.get(url, params).then(function(res) {
    var collectionLabels = {};
    res.data.facets.collection_id.forEach(function(c) {
      collectionLabels[c.value] = c.label;
    });

    dfd.resolve({
      data: res.data,
      collectionLabels: collectionLabels,
      query: query
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
