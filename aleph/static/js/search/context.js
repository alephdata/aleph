
aleph.factory('QueryContext', ['$http', '$q', function($http, $q) {
    var dfd = null;

    var reset = function() { dfd = null; };

    var load = function() {
      dfd = $q.defer();
      $q.all([
        $http.get('/api/1/sources'),
        $http.get('/api/1/lists'),
        $http.get('/api/1/query/attributes')
      ]).then(function(results) {
          var sources = {}
          angular.forEach(results[0].data.results, function(c) {
            sources[c.slug] = c;
          });
          dfd.resolve({
            'sources': sources,
            'lists': results[1].data,
            'attributes': results[2].data,
          });
      });
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
