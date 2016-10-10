
aleph.factory('Network', ['$q', '$http', '$location', '$uibModal', 'Metadata', 'Query', function($q, $http, $location, $uibModal, Metadata, Query) {
  return {
    fromQuery: function(collectionId) {
      var dfd = $q.defer(),
          query = Query.parse(),
          nodes = query.getArray('node'),
          params = {node_id: nodes, limit: 300},
          network = {collection_id: collectionId};

      if (!nodes.length) {
        dfd.resolve(network);
      } else {
        $http.post('/api/1/graph/nodes', params).then(function(res) {
          network['nodes'] = res.data.results;
          dfd.resolve(network);
        }, function(err) {
          dfd.reject(err);
        });
      }
      return dfd.promise;
    },
    search: function(collectionId) {
      var dfd = $q.defer(),
          url = '/api/1/collections/' + collectionId + '/networks';
      $http.get(url).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
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
            params = {
              node_id: network.nodes.map(function(n) { return n.id; }),
              limit: network.nodes.length + 1
            };
        $http.post('/api/1/graph/nodes', params).then(function(res) {
          network.edges = [];
          network.nodes = network.nodes.map(function(n) {
            for (var i in res.data.results) {
              var node = res.data.results[i];
              if (node.id == n.id) {
                node.gridX = n.gridX;
                node.gridY = n.gridY;
                return node;
              }
            }
          }).filter(function(n) {
            return !!n;
          });
          dfd.resolve(network);
        }, function(err) {
          dfd.reject(err);
        });
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    delete: function(network) {
      var instance = $uibModal.open({
        templateUrl: 'templates/networks/delete.html',
        controller: 'NetworksDeleteCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          network: function() {
            return network;
          }
        }
      });
      return instance.result;
    }
  };
}]);
