import aleph from '../aleph';

aleph.factory('Dataset', ['$q', '$http', '$location', 'Authz', 'Metadata',
    function($q, $http, $location, Authz, Metadata) {

  var indexDfd = null;

  var getIndex = function() {
    if (indexDfd === null) {
      indexDfd = $q.defer();
      $http.get('/api/1/datasets', {cache: true}).then(function(res) {
        indexDfd.resolve(res.data)
      }, function(err) {
        indexDfd.reject(err);
      });
    }
    return indexDfd.promise;
  }

  return {
    index: getIndex,
    get: function(name) {
      var dfd = $q.defer(),
          url = '/api/1/datasets/' + name;
      $http.get(url, {cache: true}).then(function(res) {
        dfd.resolve(res.data)
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    getBase: function(name) {
      var dfd = $q.defer();
      getIndex().then(function(data) {
        for (var i in data.results) {
          var dataset = data.results[i];
          if (dataset.name == name) {
            dfd.resolve(dataset);
          }
        }
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    }
  };
}]);
