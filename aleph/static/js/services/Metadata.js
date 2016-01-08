
aleph.factory('Metadata', ['$http', '$q', 'Session', function($http, $q, Session) {
    var dfd = null,
        rolesDfd = null;

    var flush = function() {
      Session.flush();
      dfd = null;
      rolesDfd = null;
      return get();
    };

    var load = function() {
      dfd = $q.defer();
      Session.get().then(function(session) {
        $q.all([
          $http.get('/api/1/watchlists?limit=1000&_uid=' + session.cbq),
          $http.get('/api/1/fields?_uid=' + session.cbq)
        ]).then(function(results) {
            var watchlists = {}
            angular.forEach(results[0].data.results, function(c) {
              watchlists[c.id] = c;
            });

            dfd.resolve({
              'session': session,
              'watchlists': watchlists,
              'fields': results[1].data,
            });
        });
      });
    };

    var get = function() {
      if (dfd === null) { load(); }
      return dfd.promise;
    };

    var getRoles = function() {
      if (rolesDfd === null) {
        rolesDfd = $q.defer();
        $http.get('/api/1/roles').then(function(res) {
          rolesDfd.resolve(res.data);
        }, function(err) {
          rolesDfd.reject(err);
        });
      }
      return rolesDfd.promise;
    };

    return {
      get: get,
      getRoles: getRoles,
      flush: flush
    };

}]);
