
aleph.factory('Role', ['$http', '$q', function($http, $q) {
    var dfd = null;

    var getCommon = function() {
      if (dfd === null) {
        // var params = {'type': ['system', 'group']}
        dfd = $q.defer();
        $http.get('/api/1/roles', {cache: true}).then(function(res) {
          dfd.resolve(res.data);
        }, function(err) {
          dfd.reject(err);
        });
      }
      return dfd.promise;
    };

    return {
      getCommon: getCommon
    };

}]);
