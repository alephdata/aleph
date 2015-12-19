
var loadSearchResult = ['$http', '$q', '$route', 'Query', 'Session',
  function($http, $q, $route, Query, Session) {
  var dfd = $q.defer();
  Session.get(function(session) {
    var query = angular.copy(Query.load());
    query['_uid'] = session.cbq;
    query['limit'] = Query.mode() == 'table' ? 35 : 0;
    $http.get('/api/1/query', {params: query}).then(function(res) {
      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];
