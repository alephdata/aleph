var loadUsers = ['$http', '$q', '$route', 'Session', function($http, $q, $route, Session) {
  var dfd = $q.defer();
  Session.get().then(function(session) {
    $http.get('/api/1/users', {params: {'_uid': session.cbq}}).then(function(res) {
      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];
