
aleph.factory('Role', ['$http', '$q', function($http, $q) {
  var dfd = null;

  var getAll = function() {
    if (dfd === null) {
      // var params = {'type': ['system', 'group']}
      dfd = $q.defer();
      $http.get('/api/1/roles', {cache: true}).then(function(res) {
        dfd.resolve(res.data.results);
      }, function(err) {
        dfd.reject(err);
      });
    }
    return dfd.promise;
  };

  return {
    getAll: getAll
  };
}]);
