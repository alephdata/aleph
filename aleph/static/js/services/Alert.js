
aleph.factory('Alert', ['$http', '$q', '$location', '$sce', '$uibModal',
    function($http, $q, $location, $sce, $uibModal) {
  var indexDfd = null;

  return {
    index: function(id) {
      if (indexDfd === null) {
        indexDfd = $q.defer();
        $http.get('/api/1/alerts').then(function(res) {
          indexDfd.resolve(res.data);
        }, function(err) {
          indexDfd.resolve({total: 0, results: []});
        });
      }
      return indexDfd.promise;
    },
    delete: function(id) {
      return $http.delete('/api/1/alerts/' + id).then(function(res) {
        indexDfd = null;
      });
    },
    create: function(alert) {
      var dfd = $q.defer();
      $http.post('/api/1/alerts', alert).then(function(res) {
        indexDfd = null;
        dfd.resolve(res.data);
      }, function(err) {
        indexDfd = null;
        dfd.reject(err);
      });
      return dfd.promise;
    }
  };
}]);
