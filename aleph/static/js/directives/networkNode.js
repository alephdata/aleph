aleph.directive('networkNode', ['$http', function($http) {
  return {
    restrict: 'E',
    require: '^networkWorkspace',
    scope: {
      'node': '='
    },
    templateUrl: 'templates/networks/node.html',
    link: function (scope, element, attrs, ctrl) {
      scope.query = {text: ''};

      scope.search = function() {
        var params = {
          ignore: ctrl.getEdgeIds(),
          limit: 10,
          source_id: scope.node.id,
          text: scope.query.text
        };
        $http.post('/api/1/graph/edges', params).then(function(res) {
          scope.suggestedEdges = res.data.results.map(function(edge) {
            if (edge.$source.id == scope.node.id) {
              edge.$other = edge.$target;
            } else {
              edge.$other = edge.$source;
            }
            return edge;
          });
        });
      };

      scope.addEdge = function(edge) {
        var idx = scope.suggestedEdges.indexOf(edge);
        scope.suggestedEdges.splice(idx, 1);
        ctrl.addEdge(edge);
        ctrl.update();
        scope.search();
      };

      scope.remove = function() {
        ctrl.removeNode(scope.node);
      };

      scope.search();
    }
  };
}]);
