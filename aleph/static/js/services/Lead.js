import aleph from '../aleph';

aleph.factory('Lead', ['$q', '$http', 'Query', function($q, $http, Query) {
  return {
    search: function(collectionId) {
      var query = Query.parse(),
          state = angular.copy(query.state),
          dfd = $q.defer(),
          url = '/api/1/collections/' + collectionId + '/leads';
      state['limit'] = 30;
      state['facet'] = ['dataset', 'collections', 'schema'];
      state['offset'] = state.offset || 0;
      $http.get(url, {params: state}).then(function(res) {
        dfd.resolve({
          query: query,
          result: res.data
        });
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    }
  };
}]);
