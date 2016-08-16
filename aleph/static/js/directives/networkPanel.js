aleph.directive('networkPanel', ['$http', function($http) {
  return {
    restrict: 'E',
    require: '^networkWorkspace',
    templateUrl: 'templates/networks/panel.html',
    link: function (scope, element, attrs, ctrl) {
      scope.query = {
        text: '',
        collectionFilter: true
      };
      scope.nodesMode = true;
      scope.edgesMode = false;
      scope.selection = [];

      scope.getIcon = function(data) {
        var type = data.alephSchema || data.$label;
        return ctrl.config.icons[type] || '\uf0c8'
      };

      scope.getColor = function(data) {
        var type = data.alephSchema || data.$label;
        return ctrl.config.colors[type] || '#777777'
      };

      scope.searchNodes = function() {
        var params = {
          ignore: ctrl.getNodeIds(),
          limit: 10,
          text: scope.query.text
        };
        if (scope.query.collectionFilter) {
          params.collection_id = ctrl.collection_id;
        }
        $http.post('/api/1/graph/nodes', params).then(function(res) {
          scope.suggestedNodes = res.data.results;
        });
      };

      scope.searchEdges = function() {
        var nodeIds = scope.selection.map(function(n) {
          return n.id;
        });
        var params = {
          ignore: ctrl.getEdgeIds(),
          limit: 10,
          source_id: nodeIds,
          text: scope.query.text
        };
        if (scope.query.collectionFilter) {
          params.collection_id = ctrl.collection_id;
        }
        $http.post('/api/1/graph/edges', params).then(function(res) {
          scope.suggestedEdges = res.data.results.map(function(edge) {
            if (nodeIds.indexOf(edge.$source.id) == -1) {
              edge.$other = edge.$source;
            } else {
              edge.$other = edge.$target;
            }
            return edge;
          });
        });
      };

      scope.search = function() {
        if (scope.nodesMode) {
          scope.searchNodes();
        } else {
          scope.searchEdges();
        }
      };

      scope.addNode = function(node) {
        var idx = scope.suggestedNodes.indexOf(node);
        scope.suggestedNodes.splice(idx, 1);
        ctrl.addNode(node);
        ctrl.completeNode(node);
        scope.searchNodes();
      };

      scope.addEdge = function(edge) {
        var idx = scope.suggestedEdges.indexOf(edge);
        scope.suggestedEdges.splice(idx, 1);
        // console.log(edge);
        ctrl.addEdge(edge);
        ctrl.update();
        scope.searchEdges();
      };

      var unsub = scope.$on('updateNetworkSelection', function(e, selection) {
        if (selection.length) {
          scope.nodesMode = false;
          scope.query.collectionFilter = false;
        } else {
          scope.nodesMode = true;
          scope.query.collectionFilter = true;
        }
        // console.log(selection);
        scope.edgesMode = !scope.nodesMode;
        scope.selection = selection;
        scope.search();
      });
      scope.$on('$destroy', unsub);
      scope.search();
    }
  };
}]);
