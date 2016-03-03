
var loadSearch = ['$http', '$q', '$route', '$location', 'Query', 'Session', 'Metadata',
    function($http, $q, $route, $location, Query, Session, Metadata) {
  var dfd = $q.defer();

  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      var query = angular.copy(Query.load());
      query['limit'] = 30;
      query['snippet'] = 140;
      query['offset'] = $location.search().offset || 0;
      $http.get('/api/1/query', {params: query}).then(function(res) {
        var result = res.data;
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
