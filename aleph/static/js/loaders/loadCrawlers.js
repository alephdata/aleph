
var loadCrawlers = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  $http.get('/api/1/crawlers').then(function(res) {
    dfd.resolve(res.data.results);
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];


var loadCrawlerStates = ['$http', '$q', '$route', '$location', function($http, $q, $route, $location) {
  var dfd = $q.defer(),
      query = $location.search();
  $http.get('/api/1/crawlerstates', {params: query}).then(function(res) {
    dfd.resolve(res.data);
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];
