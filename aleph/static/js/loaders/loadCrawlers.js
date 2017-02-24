
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

export default loadCrawlers;
