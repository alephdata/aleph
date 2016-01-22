
var loadQueryPages = ['$http', '$q', '$route', '$sce', '$route', 'Query', 'Session',
    function($http, $q, $route, $sce, $route, Query, Session) {
  var dfd = $q.defer(),
      documentId = $route.current.params.document_id;
  Session.get().then(function(session) {
    var query = angular.copy(Query.load()),
        url = '/api/1/query/records/' + documentId;

    if (query.q || query.entity) {
      query['_uid'] = session.cbq;
      query['limit'] = 100;
      $http.get(url, {params: query}).then(function(res) {
        for (var i in res.data.results) {
          var record = res.data.results[i];
          record.snippet = $sce.trustAsHtml(record.text[0]);
        }
        dfd.resolve(res.data);
      });
    } else {
      dfd.resolve({});
    }
  });
  return dfd.promise;
}];
