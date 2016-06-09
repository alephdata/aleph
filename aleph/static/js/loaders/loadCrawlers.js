
var loadCrawlers = ['$http', '$q', '$route', '$location', function($http, $q, $route, $location) {
  var dfd = $q.defer(),
      params = $location.search();
  $http.get('/api/1/crawlers', {params: params}).then(function(res) {
    dfd.resolve(res.data);
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
