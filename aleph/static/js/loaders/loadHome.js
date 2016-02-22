
var loadHome = ['$http', '$q', '$route', 'Query', 'Session', 'Metadata',
    function($http, $q, $route, Query, Session, Metadata) {
  var dfd = $q.defer();

  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      var query = {limit: 0};
      $http.get('/api/1/query', {params: query}).then(function(res) {
        dfd.resolve({
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
