
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
  query['limit'] = Query.mode() == 'table' ? 35 : 0;
  $http.get('/api/1/query', {params: query}).then(function(res) {
    dfd.resolve(res.data);
  });
  return dfd.promise;
}];


var loadSearchAttributes = ['$http', '$q', '$route', 'Query', function($http, $q, $route, Query) {
  var dfd = $q.defer();
  $http.get('/api/1/query/attributes', {params: Query.load()}).then(function(res) {
    var attributes = res.data;

    if (Query.state.attribute.length == 0) {
      angular.forEach(res.data.core, function(enable, a) {
        if (enable) {
          Query.state.attribute.push(a);
        }
      });
    }

    dfd.resolve(attributes);
  });
  return dfd.promise;
}];


var loadSearchGraph = ['$http', '$q', '$route', 'Query', function($http, $q, $route, Query) {
  var dfd = $q.defer();
  var query = angular.copy(Query.load());
  query['limit'] = 75; // hello dunbar?
  $http.get('/api/1/graph', {params: query}).then(function(res) {
    dfd.resolve(res.data);
  });
  return dfd.promise;
}];
