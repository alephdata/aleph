
var loadSearchCollections = ['$http', '$q', 'Query', function($http, $q, Query) {
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
