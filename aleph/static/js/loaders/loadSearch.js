
var loadSearch = ['$http', '$q', '$route', '$location', 'Query', 'History', 'Session', 'Metadata',
    function($http, $q, $route, $location, Query, History, Session, Metadata) {
  var dfd = $q.defer();

  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 30;
      state['snippet'] = 140;
      state['offset'] = state.offset || 0;
      History.setLastSearch(query.state);
      $http.get('/api/1/query', {cache: true, params: state}).then(function(res) {
        dfd.resolve({
          'query': query,
          'result': res.data,
          'metadata': metadata
        });
      }, function(err) {
        if (err.status == 400) {
          dfd.resolve({
            'result': {
              'error': err.data
            },
            'query': query,
            'metadata': metadata
          });
        }
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
