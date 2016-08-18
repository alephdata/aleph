
aleph.factory('Network', ['$q', '$http', '$location', 'Metadata', 'Query', function($q, $http, $location, Metadata, Query) {
  return {
    fromQuery: function(collectionId) {
      var dfd = $q.defer(),
          query = Query.parse(),
          edges = query.getArray('edge'),
          params = {edge_id: edges, limit: 30},
          network = {collection_id: collectionId};

      if (!edges.length) {
        dfd.resolve(network);
      } else {
        $http.post('/api/1/graph/edges', params).then(function(res) {
          network['edges'] = res.data.results;
          dfd.resolve(network);
        });
      }
      return dfd.promise;
    }
  };
}]);
