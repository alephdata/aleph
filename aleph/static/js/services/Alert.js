
aleph.factory('Alert', ['$http', '$q', '$location', '$sce', 'Session',
    function($http, $q, $location, $sce, Session) {

  return {
    index: function(id) {
      var dfd = $q.defer(),
          url = '/api/1/alerts';
      Session.get().then(function(session) {
        $http.get(url).then(function(res) {
          dfd.resolve(res.data);
        }, function(err) {
          dfd.reject(err);
        });
      });
      return dfd.promise;
    },
    delete: function(id) {
      return $http.delete('/api/1/alerts/' + id);
    },
    create: function(query) {
      var dfd = $q.defer();
      $http.post('/api/1/alerts', {'query': query}).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    }
  };
}]);
