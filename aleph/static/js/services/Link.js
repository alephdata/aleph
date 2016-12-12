aleph.factory('Link', ['$q', '$http', 'Metadata', function($q, $http, Metadata) {
  return {
    search: function(entityId, query) {
      var dfd = $q.defer(),
          url = '/api/1/entities/' + entityId + '/links',
          state = angular.copy(query);
      state['limit'] = 25;
      state['facet'] = ['countries', 'schema'];
      state['offset'] = state.offset || 0;

      Metadata.get().then(function(metadata) {
        $http.get(url, {params: state}).then(function(res) {
          var links = res.data;
          for (var i in links.results) {
            links.results[i] = metadata.bindSchema(links.results[i]);
          }
          dfd.resolve(links);
        }, function(err) {
          dfd.reject(err);
        });
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    }
  };
}]);
