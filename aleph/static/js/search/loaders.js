
var loadSearchContext = ['QueryContext', function(QueryContext) {
  return QueryContext.get();
}];


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


var loadSearchAttributes = ['$http', '$q', '$route', 'Query', 'Session',
  function($http, $q, $route, Query, Session) {
  var dfd = $q.defer();
  Session.get(function(session) {
    var q = angular.copy(Query.load());
    q['_uid'] = session.cbq;
    $http.get('/api/1/query/attributes', {params: q}).then(function(res) {
      var attributes = res.data;
      attributes.has_attributes = false;
      angular.forEach(res.data.attributes, function(enable, a) {
        attributes.has_attributes = true;
      });

      if (Query.state.attribute.length == 0) {
        angular.forEach(res.data.fields, function(enable, a) {
          if (enable) {
            Query.toggleFilter('attribute', a, true);
          }
        });
      }

      dfd.resolve(attributes);
    });
  });
  return dfd.promise;
}];


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
