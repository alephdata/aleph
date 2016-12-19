
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
      collectionId = $route.current.params.collection_id,
      query = $location.search(),
      url = '/api/1/collections/' + collectionId + '/crawlerstates';
  $http.get(url, {params: query}).then(function(res) {
    dfd.resolve(res.data);
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];

export {loadCrawlers, loadCrawlerStates};
