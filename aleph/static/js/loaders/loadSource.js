var loadSource = ['$http', '$q', '$route', 'Session', function($http, $q, $route, Session) {
  var dfd = $q.defer(),
      url = '/api/1/sources/' + $route.current.params.slug;
  Session.get(function(session) {
    $http.get(url, {params: {'_uid': session.cbq}}).then(function(res) {
      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];
