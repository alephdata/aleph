
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
    },
    get: function(collectionId, networkId) {
      var dfd = $q.defer(),
          url = '/api/1/collections/' + collectionId + '/networks/' + networkId;

      // ok this is a bit longer than it should be. basically the network data 
      // served out by the networks_api is just the IDs and positional info, the
      // actual node and edge data (such as names) need to be loaded and merged
      // separately.
      $http.get(url).then(function(res) {
        var network = res.data,
            edgesParams = {
              edge_id: network.edges.map(function(e) { return e.id; })
            },
            nodesParams = {
              node_id: network.nodes.map(function(n) { return n.id; })
            };
        $q.all([
          $http.post('/api/1/graph/edges', edgesParams),
          $http.post('/api/1/graph/nodes', nodesParams)
        ]).then(function(res) {
          network.edges = res[0].data.results;
          network.nodes = network.nodes.map(function(n) {
            for (var i in res[1].data.results) {
              var node = res[1].data.results[i];
              if (node.id == n.id) {
                node.gridX = n.gridX;
                node.gridY = n.gridY;
                return node;
              }
            }
          });
          dfd.resolve(network);
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
