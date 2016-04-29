
var loadEntitiesIndex = ['$http', '$q', '$route', '$location', 'Session', 'Metadata', 'Query',
    function($http, $q, $route, $location, Session, Metadata, Query) {
  var dfd = $q.defer();
  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 30;
      state['doc_counts'] = 'true';
      state['facet'] = ['jurisdiction_code', '$schema'];
      state['offset'] = state.offset || 0;
      $http.get('/api/1/entities', {params: state}).then(function(res) {
        var result = res.data;
        dfd.resolve({
          'query': query,
          'result': result,
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
