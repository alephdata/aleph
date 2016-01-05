var loadDocument = ['$http', '$q', '$route', 'Session', function($http, $q, $route, Session) {
  var dfd = $q.defer(),
      url = '/api/1/documents/' + $route.current.params.document_id;
  Session.get().then(function(session) {
    $http.get(url, {params: {'_uid': session.cbq}}).then(function(res) {
      dfd.resolve(res.data);
    }, function(err) {
      dfd.reject(err);
    });
  });
  return dfd.promise;
}];
