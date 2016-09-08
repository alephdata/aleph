
aleph.factory('Role', ['$http', '$q', 'Metadata', function($http, $q, Metadata) {
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

  var save = function(role) {
    var dfd = $q.defer(),
        url = '/api/1/roles/' + role.id;
    $http.post(url, role).then(function(res) {
      Metadata.flush().then(function() {
        dfd.resolve(res.data);
      });
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  };

  return {
    getAll: getAll,
    save: save
  };
}]);
