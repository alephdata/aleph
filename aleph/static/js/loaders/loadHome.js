var loadHome = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  var query = {limit: 0, facet: 'collections'};
  $http.get('/api/1/query', {cache: true, params: query}).then(function(res) {
    dfd.resolve({
      documents: res.data
    });
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];
