
aleph.factory('Document', ['$http', '$q', 'Session', function($http, $q, Session) {
    return {
      get: function(id) {
        var dfd = $q.defer(),
            url = url = '/api/1/documents/' + id;
        Session.get().then(function(session) {
          $http.get(url).then(function(res) {
            dfd.resolve(res.data);
          }, function(err) {
            dfd.reject(err);
          });
        });
        return dfd.promise;
      }
    };

}]);
