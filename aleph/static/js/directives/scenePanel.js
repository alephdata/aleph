aleph.directive('scenePanel', ['$http', function($http) {
  return {
    restrict: 'E',
    require: '^sceneWorkspace',
    templateUrl: 'templates/scene_panel.html',
    link: function (scope, element, attrs, ctrl) {
      scope.search = {
        'text': '',
        'collectionFilter': true
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
          text: scope.search.text
        };
        if (scope.search.collectionFilter) {
          params.collection_id = ctrl.collection_id;
        }
        $http.post('/api/1/graph/nodes', params).then(function(res) {
          scope.suggestedNodes = res.data.results;
        });
      };

      scope.searchEdges = function() {
        var params = {
          ignore: ctrl.getEdgeIds(),
          limit: 10,
          source_id: ctrl.selection.map(function(n) {
            return n.id;
          }),
          text: scope.search.text
        };
        if (scope.search.collectionFilter) {
          params.collection_id = ctrl.collection_id;
        }
        $http.post('/api/1/graph/edges', params).then(function(res) {
          scope.suggestedEdges = res.data.results;
        });
      };

      scope.addNode = function(node) {
        var idx = scope.suggestedNodes.indexOf(node);
        scope.suggestedNodes.splice(idx, 1);
        ctrl.addNode(node);
        ctrl.completeNode(node);
        scope.searchNodes();
      };

      scope.addEdge = function(edge) {
        var idx = scope.suggestedNodes.indexOf(node);
        scope.suggestedNodes.splice(idx, 1);
        ctrl.addNode(node);
        ctrl.completeNode(node);
        scope.searchNodes();
      };

      var unsub = scope.$on('updateSceneSelection', function(e, selection) {
        if (selection.length) {
          scope.nodesMode = false;
        } else {
          scope.nodesMode = true;
        }
        console.log(selection);
        scope.edgesMode = !scope.nodesMode;
        scope.selection = selection;
      });
      scope.$on('$destroy', unsub);

      scope.searchNodes();
    }
  };
}]);
