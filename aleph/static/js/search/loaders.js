
var loadSearchCollections = ['$http', '$q', function($http, $q) {
  var dfd = $q.defer();
  $http.get('/api/1/collections').then(function(res) {
    var collections = {}
    angular.forEach(res.data.results, function(c) {
      collections[c.slug] = c;
    });
    dfd.resolve(collections);
  });
  return dfd.promise;
}];


var loadSearchResult = ['$http', '$q', '$route', 'Query', function($http, $q, $route, Query) {
  var dfd = $q.defer();
  var query = angular.copy(Query.load());
  query['limit'] = Query.state.mode == 'table' ? 35 : 0;
  $http.get('/api/1/query', {params: query}).then(function(res) {
    dfd.resolve(res.data);
  });
  return dfd.promise;
}];



