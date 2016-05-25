
var loadSearch = ['$http', '$q', '$route', '$location', 'Query', 'History',
    function($http, $q, $route, $location, Query, History) {
  var dfd = $q.defer();
  var query = Query.parse(),
      state = angular.copy(query.state);
  state['limit'] = 30;
  state['snippet'] = 140;
  state['offset'] = state.offset || 0;
  History.setLastSearch(query.state);
  $http.get('/api/1/query', {cache: true, params: state}).then(function(res) {
    dfd.resolve({
      'query': query,
      'result': res.data
    });
  }, function(err) {
    if (err.status == 400) {
      dfd.resolve({
        'result': {
          'error': err.data
        },
        'query': query
      });
    }
    dfd.reject(err);  
  });
  return dfd.promise;
}];
