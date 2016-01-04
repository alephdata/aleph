
aleph.factory('Session', ['$http', '$q', function($http, $q) {
  var dfd = null;

  var getSession = function() {
    if (!dfd) {
      var dt = new Date(),
          config = {cache: false, params: {'_': dt.getTime()}};
      dfd = $q.defer();
      $http.get('/api/1/sessions', config).then(function(res) {
        res.data.cbq = res.data.logged_in ? res.data.user.id : 'anon';
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
    }
    return dfd.promise;
  };

  return {
    get: getSession,
    flush: function() {
      dfd = null;
      return getSession();
    }
  }
}]);
