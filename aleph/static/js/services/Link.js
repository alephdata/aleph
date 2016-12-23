import aleph from '../aleph';

aleph.factory('Link', ['$q', '$http', 'Query', 'Metadata', function($q, $http, Query, Metadata) {
  return {
    search: function(entityId, prefix) {
      var query = Query.parse(prefix),
          state = angular.copy(query.state),
          dfd = $q.defer(),
          url = '/api/1/entities/' + entityId + '/links';
      state['limit'] = 10;
      state['facet'] = ['remote.countries', 'schema'];
      state['offset'] = state.offset || 0;
      Metadata.get().then(function(metadata) {
        $http.get(url, {params: state}).then(function(res) {
          var links = res.data;
          for (var i in links.results) {
            links.results[i] = metadata.bindSchema(links.results[i]);
          }
          dfd.resolve({
            query: query,
            result: links
          });
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
