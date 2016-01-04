
aleph.factory('Metadata', ['$http', '$q', 'Session', function($http, $q, Session) {
    var dfd = null;

    var flush = function() {
      Session.flush();
      dfd = null;
      return get();
    };

    var load = function() {
      dfd = $q.defer();
      Session.get().then(function(session) {
        $q.all([
          $http.get('/api/1/watchlists?_uid=' + session.cbq),
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
    }

    return {
      get: get,
      flush: flush
    };

}]);
