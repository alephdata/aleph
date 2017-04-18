import aleph from '../aleph';

aleph.factory('Role', ['$http', '$q', 'Metadata', function($http, $q, Metadata) {

  var suggest = function(prefix) {
    var data = {params: {prefix: prefix.trim()}};
    return $http.get('/api/1/roles/_suggest', data).then(function(res) {
      return res.data.results;
    });
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

  var get = function(role_id) {
    var dfd = $q.defer();
    $http.get('/api/1/roles/' + role_id).then(function(res) {
      dfd.resolve(res.data);
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  };

  var create = function(role) {
    var dfd = $q.defer(),
        url = '/api/1/roles';

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
    suggest: suggest,
    get: get,
    save: save,
    create: create
  };
}]);
