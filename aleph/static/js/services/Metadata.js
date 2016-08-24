
aleph.factory('Metadata', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
  var dfd = null;

  var flush = function() {
    dfd = null;
    return get();
  };

  var load = function() {
    var dt = new Date();
    dfd = $q.defer();
    $q.all([
      $http.get('/api/1/sessions', {cache: false, params: {'_': dt.getTime()}}),
      $http.get('/api/1/metadata', {cache: true})
    ]).then(function(results) {
      var session = results[0].data,
          metadata = angular.extend(results[1].data, {session: session});
      $rootScope.session = session;
      dfd.resolve(metadata);
    });
  };

  var get = function() {
    if (dfd === null) {
      load();
    }
    return dfd.promise;
  };

  return {
    get: get,
    flush: flush
  };

}]);
