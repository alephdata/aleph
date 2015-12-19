var loadSearchGraph = ['$http', '$q', '$route', 'Query', 'Session',
  function($http, $q, $route, Query, Session) {
  var dfd = $q.defer();
  Session.get(function(session) {
    var query = angular.copy(Query.load());
    query['_uid'] = session.cbq;
    query['limit'] = 75; // hello dunbar?
    $http.get('/api/1/graph', {params: query}).then(function(res) {
      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];
