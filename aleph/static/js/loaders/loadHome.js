
var loadHome = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  var query = {limit: 0};
  $http.get('/api/1/query', {cache: true, params: query}).then(function(res) {
    var sources = {};
    for (var i in res.data.sources.values) {
      var source = res.data.sources.values[i],
          category = source.category || 'other';
      if (!sources[category]) {
        sources[category] = [source];
      } else {
        sources[category].push(source);
      }
    }
    dfd.resolve({
      'sources': sources,
      'result': res.data
    });
  }, function(err) {
    dfd.reject(err);  
  });
  return dfd.promise;
}];
