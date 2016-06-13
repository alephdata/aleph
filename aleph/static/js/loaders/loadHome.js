var loadHome = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  var query = {limit: 0};
  $http.get('/api/1/query', {cache: true, params: query}).then(function(res) {
    var collections = {};
    for (var i in res.data.facets.collections.values) {
      var collection = res.data.facets.collections.values[i],
          category = collection.category || 'other';
      if (!collections[category]) {
        collections[category] = [collection];
      } else {
        collections[category].push(collection);
      }
    }
    dfd.resolve({
      collections: collections,
      result: res.data
    });
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];
