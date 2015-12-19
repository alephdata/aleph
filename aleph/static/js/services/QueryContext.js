
aleph.factory('QueryContext', ['$http', '$q', 'Session', function($http, $q, Session) {
    var dfd = null;

    var reset = function() { dfd = null; };

    var load = function() {
      dfd = $q.defer();
      Session.get(function(session) {
        $q.all([
          $http.get('/api/1/sources?_uid=' + session.cbq),
          $http.get('/api/1/lists?_uid=' + session.cbq),
          $http.get('/api/1/query/attributes?_uid=' + session.cbq)
        ]).then(function(results) {

            var sources = {}
            angular.forEach(results[0].data.results, function(c) {
              sources[c.slug] = c;
            });

            var lists = {}
            angular.forEach(results[1].data.results, function(c) {
              lists[c.id] = c;
            });

            dfd.resolve({
              'sources': sources,
              'lists': lists,
              'attributes': results[2].data,
            });
        });
      })
    };

    var get = function() {
      if (dfd === null) { load(); }
      return dfd.promise;
    }

    return {
      get: get,
      reset: reset
    };

}]);
