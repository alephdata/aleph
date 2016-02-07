
var loadSearch = ['$http', '$q', '$route', 'Query', 'Session', 'Metadata',
    function($http, $q, $route, Query, Session, Metadata) {
  var dfd = $q.defer();

  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      var query = angular.copy(Query.load());
      query['_uid'] = session.cbq;
      query['limit'] = 100;
      $http.get('/api/1/query', {params: query}).then(function(res) {
        var result = res.data;
        result.sources.labels = {};
        for (var i in res.data.sources.values) {
          var src = res.data.sources.values[i];
          result.sources.labels[src.id] = src.label;
        }

        dfd.resolve({
          'result': result,
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
