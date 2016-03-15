
var loadHome = ['$http', '$q', '$route', 'Query', 'Session', 'Metadata',
    function($http, $q, $route, Query, Session, Metadata) {
  var dfd = $q.defer();

  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
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
          'result': res.data,
          'metadata': metadata
        });
      }, function(err) {
        dfd.reject(err);  
      });
    }, function(err) {
      dfd.reject(err);
    });
  }, function(err) {
    dfd.reject(err);
  });

  return dfd.promise;
}];
