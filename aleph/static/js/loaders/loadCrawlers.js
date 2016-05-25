
var loadCrawlers = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  $http.get('/api/1/crawlers').then(function(res) {
    dfd.resolve(res.data.results);
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];
