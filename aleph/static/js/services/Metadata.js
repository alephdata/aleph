
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
          $http.get('/api/1/metadata')
        ]).then(function(results) {
            var watchlists = {},
                watchlistsCount = 0, 
                metadata = results[1].data;
            angular.forEach(results[0].data.results, function(c) {
              watchlists[c.id] = c;
              watchlistsCount++;
            });

            dfd.resolve({
              'session': session,
              'watchlists': watchlists,
              'watchlistsCount': watchlistsCount,
              'fields': metadata.fields,
              'countries': metadata.countries, 
              'languages': metadata.languages
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
