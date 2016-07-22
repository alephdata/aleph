var loadHome = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  $http.get('/api/1/statistics', {cache: true}).then(function(res) {
    dfd.resolve(res.data);
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];
