import aleph from '../aleph';

aleph.factory('Dataset', ['$q', '$http', '$location', 'Query', 'Authz', 'Metadata',
    function($q, $http, $location, Query, Authz, Metadata) {

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
    search: function() {
      var dfd = $q.defer();
      var query = Query.parse(),
          state = angular.copy(query.state),
          params = {params: state, cache: true};
      $http.get('/api/1/datasets', params).then(function(res) {
        dfd.resolve({
          'query': query,
          'result': res.data
        });
      }, function(err) {
        dfd.reject(err);
      });
      getIndex();
      return dfd.promise;
    },
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
